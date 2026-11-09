import { Router } from "express";

import { LOG } from '../constants/logActions.js';
import { AppError } from '../lib/errors.js';
import { approveEvent, findManagedEvent, listManagedEvents, rejectEvent, takeDownEvent } from '../lib/managedEvents.js';
import { messages, notifyAdmins, notifyFavouriters, notifyFollowers, notifyUser } from '../lib/notifications.js';
import {
    cancelEvent,
    categoryName,
    createEvent,
    deleteEvent,
    editEvent,
    findOrganiserEvent,
    findOwnEvent,
    submitDraft,
} from '../lib/organiserEvents.js';
import { findPublicEvent, listPublicEvents, summarisePublicEvents } from '../lib/publicEvents.js';
import { logAction } from '../lib/systemLogs.js';
import { readAs, writeAs } from '../middleware/auth.js';
import { acceptImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { decisionReasonSchema, eventBodySchema, eventIdParams, listEventsQuery } from '../validation/events.js';

const eventRouter = Router();

// The public lists: Explore Events, Home's What's on, Preferences, About
eventRouter.get('/', validate({ query: listEventsQuery }), async (req, res) => {
    res.json(await listPublicEvents(req.valid.query));
});

// Counts for Home and About. Before /:id, or "summary" would be read as an ID
eventRouter.get('/summary', async (req, res) => {
    res.json({ data: await summarisePublicEvents() });
});

// Manage Events and Admin Home (Phase 7): every event but drafts, for admins.
// Before /:id too
eventRouter.get('/manage', ...readAs('admin'), async (req, res) => {
    res.json({ data: await listManagedEvents() });
});

// Event details for guests and users. An event that was never public reads as
// not found rather than forbidden, so its existence isn't given away
eventRouter.get('/:id', validate({ params: eventIdParams }), async (req, res) => {
    const event = await findPublicEvent(req.valid.params.id);
    if (!event) throw new AppError(404, 'Event not found.');
    res.json({ data: event });
});

// Create Event. Create and Edit take the form as JSON, or with a photo as
// multipart (Phase 6)
eventRouter.post('/', ...writeAs('organiser'), ...acceptImage('image'), validate({ body: eventBodySchema }), async (req, res) => {
    const event = await createEvent(req.user, req.valid.body, req.file);

    if (event.status === 'pending') await notifyAdmins(messages.pendingReview({ eventId: event.eventId, name: event.eventName }, 'new'));
    await logAction(LOG.EVENT_CREATED, req.user, { eventId: event.eventId, name: event.eventName, status: event.status });
    res.status(201).json({ data: await findOrganiserEvent(event.eventId) });
});

// Edit Event
eventRouter.put('/:id', ...writeAs('organiser'), ...acceptImage('image'), validate({ params: eventIdParams, body: eventBodySchema }), async (req, res) => {
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    const status = await editEvent(row, req.user, req.valid.body, req.file);

    // Admins hear when it starts waiting, not at every save while it waits
    if (status === 'pending' && row.status !== 'pending') {
        const kind = { draft: 'new', approved: 'edit' }[row.status] ?? 'again';
        await notifyAdmins(messages.pendingReview({ eventId: row.eventId, name: req.valid.body.eventName }, kind));
    }
    const action = row.status === 'draft' && status === 'pending' ? LOG.DRAFT_SUBMITTED : LOG.EVENT_UPDATED;
    await logAction(action, req.user, { eventId: row.eventId, name: req.valid.body.eventName });
    res.json({ data: await findOrganiserEvent(row.eventId) });
});

// My Drafts' Submit for approval
eventRouter.put('/:id/submit', ...writeAs('organiser'), validate({ params: eventIdParams }), async (req, res) => {
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    await submitDraft(row, req.user);

    await notifyAdmins(messages.pendingReview({ eventId: row.eventId, name: row.eventName }, 'new'));
    await logAction(LOG.DRAFT_SUBMITTED, req.user, { eventId: row.eventId, name: row.eventName });
    res.json({ data: await findOrganiserEvent(row.eventId) });
});

// Cancel: the people who saved it and the admins hear
eventRouter.put('/:id/cancel', ...writeAs('organiser'), validate({ params: eventIdParams }), async (req, res) => {
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    const name = await cancelEvent(row);

    const event = { eventId: row.eventId, name };
    await notifyFavouriters(messages.cancelled(event, false));
    await notifyAdmins(messages.cancelledByOrganiser(event, req.user.username));
    await logAction(LOG.EVENT_CANCELLED, req.user, event);
    res.json({ data: await findOrganiserEvent(row.eventId) });
});

// Delete, for an event that has never been public
eventRouter.delete('/:id', ...writeAs('organiser'), validate({ params: eventIdParams }), async (req, res) => {
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    await deleteEvent(row);

    await logAction(LOG.EVENT_DELETED, req.user, { eventId: row.eventId, name: row.eventName });
    res.status(204).end();
});

// Approve. The first approval is when it is new to the public: its category's
// followers hear. Later ones are changes: the people who saved it hear
eventRouter.put('/:id/approve', ...writeAs('admin'), validate({ params: eventIdParams }), async (req, res) => {
    const row = await findManagedEvent(req.valid.params.id);
    const saved = await approveEvent(row, req.user);
    const wasEdit = Boolean(row.approvedSnapshot);

    const event = { eventId: saved.eventId, name: saved.eventName };
    await notifyUser(saved.organiserId, messages.approved(event, wasEdit));
    if (wasEdit) await notifyFavouriters(messages.updated(event));
    else await notifyFollowers(saved.categoryId, messages.newInCategory(event, await categoryName(saved.categoryId)));
    await logAction(LOG.EVENT_STATUS_CHANGED, req.user, { ...event, status: 'approved' });
    res.json({ data: (await listManagedEvents(saved.eventId))[0] });
});

// Reject: the organiser hears why
eventRouter.put('/:id/reject', ...writeAs('admin'), validate({ params: eventIdParams, body: decisionReasonSchema }), async (req, res) => {
    const row = await findManagedEvent(req.valid.params.id);
    const { reason } = req.valid.body;
    const saved = await rejectEvent(row, reason, req.user);

    const event = { eventId: saved.eventId, name: saved.eventName };
    await notifyUser(saved.organiserId, messages.rejected(event, Boolean(row.approvedSnapshot), reason));
    await logAction(LOG.EVENT_STATUS_CHANGED, req.user, { ...event, status: 'rejected', reason });
    res.json({ data: (await listManagedEvents(saved.eventId))[0] });
});

// Take a live event down: the organiser hears why, and the people who saved it
// hear it is cancelled
eventRouter.put('/:id/take-down', ...writeAs('admin'), validate({ params: eventIdParams, body: decisionReasonSchema }), async (req, res) => {
    const row = await findManagedEvent(req.valid.params.id);
    const { reason } = req.valid.body;
    const saved = await takeDownEvent(row, reason, req.user);

    const event = { eventId: saved.eventId, name: saved.eventName };
    await notifyUser(saved.organiserId, messages.takenDown(event, reason));
    await notifyFavouriters(messages.cancelled(event, true));
    await logAction(LOG.EVENT_STATUS_CHANGED, req.user, { ...event, status: 'cancelled', reason });
    res.json({ data: (await listManagedEvents(saved.eventId))[0] });
});

export default eventRouter;
