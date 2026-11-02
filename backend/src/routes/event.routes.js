import { Router } from "express";

import { and, eq, not } from 'drizzle-orm';

import { db } from '../db/index.js';
import { events } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import { AppError } from '../lib/errors.js';
import {
    categoryIdFor,
    findOrganiserEvent,
    findOwnEvent,
    fromSnapshot,
    isOver,
    locationIdFor,
    snapshotOf,
    wasPublic,
} from '../lib/organiserEvents.js';
import { findPublicEvent, hasBeenPublic, listPublicEvents, summarisePublicEvents } from '../lib/publicEvents.js';
import { logAction } from '../lib/systemLogs.js';
import { requireAuth, requireActive, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eventBodySchema, eventIdParams, listEventsQuery } from '../validation/events.js';

const eventRouter = Router();

// The public lists: Explore Events, Home's What's on, Preferences, About
eventRouter.get('/', validate({ query: listEventsQuery }), async (req, res) => {
    res.json(await listPublicEvents(req.valid.query));
});

// Counts for Home and About. Before /:id, or "summary" would be read as an ID
eventRouter.get('/summary', async (req, res) => {
    res.json({ data: await summarisePublicEvents() });
});

// Event details for guests and users. An event that was never public reads as
// not found rather than forbidden, so its existence isn't given away
eventRouter.get('/:id', validate({ params: eventIdParams }), async (req, res) => {
    const event = await findPublicEvent(req.valid.params.id);
    if (!event) throw new AppError(404, 'Event not found.');
    res.json({ data: event });
});

// Organisers' own events (Phase 5, decided 2026-10-05 and 2026-11-02). Every
// write is the owner's only, and a suspended organiser can only read
const asOrganiser = [requireAuth, requireActive, requireRole('organiser')];

// Sending an event for approval: the email must be verified (the one thing an
// unverified account can't do), and the start still to come. The start is
// checked when it is new to the admin: a draft being sent, or a changed time.
// A live event that has started and keeps its time can still be edited
function checkSubmittable(user, startDatetime, startIsNew, now) {
    if (!user.emailVerifiedAt) {
        throw new AppError(403, 'Verify your email address before sending an event for approval.');
    }
    if (startIsNew && startDatetime < now) {
        const message = 'The start has passed. Pick a time still to come.';
        throw new AppError(400, message, [{ path: 'body.startDatetime', message }]);
    }
}

// The body's fields as columns
async function columnsFrom({ eventName, category, description, startDatetime, endDatetime, placeId, ticketUrl }) {
    const [categoryId, locationId] = await Promise.all([categoryIdFor(category), locationIdFor(placeId)]);
    return { eventName, eventDescription: description, startDatetime, endDatetime, categoryId, locationId, ticketUrl };
}

// Create Event: Save draft, or Submit for approval
eventRouter.post('/', ...asOrganiser, validate({ body: eventBodySchema }), async (req, res) => {
    const now = new Date();
    const { submit } = req.valid.body;
    if (submit) checkSubmittable(req.user, req.valid.body.startDatetime, true, now);

    const [event] = await db
        .insert(events)
        .values({
            ...(await columnsFrom(req.valid.body)),
            organiserId: req.user.userId,
            status: submit ? 'pending' : 'draft',
            organiserUpdatedAt: submit ? now : null,
        })
        .returning();

    await logAction(LOG.EVENT_CREATED, req.user, { eventId: event.eventId, name: event.eventName, status: event.status });
    res.status(201).json({ data: await findOrganiserEvent(event.eventId) });
});

// Edit Event. A draft stays a draft unless sent; anything else goes to pending
// for an admin to approve again. Editing a live event keeps its approved
// version public, with its favourites, until the edit is approved (option b,
// 2026-10-05): the first edit copies it into approved_snapshot, later edits
// before the review leave that copy alone. Cancelled and ended events are final
eventRouter.put('/:id', ...asOrganiser, validate({ params: eventIdParams, body: eventBodySchema }), async (req, res) => {
    const now = new Date();
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    if (row.status === 'cancelled') throw new AppError(400, 'A cancelled event can\'t be edited.');
    if (isOver(row, now)) throw new AppError(400, 'This event has ended, so it can\'t be edited.');

    const { submit, startDatetime } = req.valid.body;
    const status = row.status === 'draft' && !submit ? 'draft' : 'pending';
    if (status === 'pending') {
        const startIsNew = row.status === 'draft' || startDatetime.getTime() !== row.startDatetime.getTime();
        checkSubmittable(req.user, startDatetime, startIsNew, now);
    }

    await db
        .update(events)
        .set({
            ...(await columnsFrom(req.valid.body)),
            status,
            approvedSnapshot: row.status === 'approved' ? snapshotOf(row) : row.approvedSnapshot,
            // Draft saves don't count as the organiser updating it
            organiserUpdatedAt: status === 'pending' ? now : row.organiserUpdatedAt,
        })
        .where(eq(events.eventId, row.eventId));

    const action = row.status === 'draft' && status === 'pending' ? LOG.DRAFT_SUBMITTED : LOG.EVENT_UPDATED;
    await logAction(action, req.user, { eventId: row.eventId, name: req.valid.body.eventName });
    res.json({ data: await findOrganiserEvent(row.eventId) });
});

// My Drafts' Submit for approval, without opening the form
eventRouter.put('/:id/submit', ...asOrganiser, validate({ params: eventIdParams }), async (req, res) => {
    const now = new Date();
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    if (row.status !== 'draft') throw new AppError(400, 'Only a draft can be sent for approval.');
    checkSubmittable(req.user, row.startDatetime, true, now);

    await db
        .update(events)
        .set({ status: 'pending', organiserUpdatedAt: now })
        .where(eq(events.eventId, row.eventId));

    await logAction(LOG.DRAFT_SUBMITTED, req.user, { eventId: row.eventId, name: row.eventName });
    res.json({ data: await findOrganiserEvent(row.eventId) });
});

// Cancel, for an event that has been public: people may have saved it, so it
// stays, marked cancelled. An edit still waiting is dropped and the approved
// version is the one cancelled, since that's what people saw
eventRouter.put('/:id/cancel', ...asOrganiser, validate({ params: eventIdParams }), async (req, res) => {
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    if (!wasPublic(row)) throw new AppError(400, 'This event has never been public, so delete it instead.');
    if (row.status === 'cancelled') throw new AppError(400, 'This event is already cancelled.');
    if (isOver(row)) throw new AppError(400, 'This event has ended, so it can\'t be cancelled.');

    const restored = row.approvedSnapshot ? fromSnapshot(row.approvedSnapshot) : {};
    await db
        .update(events)
        .set({ ...restored, status: 'cancelled', approvedSnapshot: null, organiserUpdatedAt: new Date() })
        .where(eq(events.eventId, row.eventId));

    await logAction(LOG.EVENT_CANCELLED, req.user, { eventId: row.eventId, name: restored.eventName ?? row.eventName });
    res.json({ data: await findOrganiserEvent(row.eventId) });
});

// Delete, only for an event that has never been public (draft, pending or
// rejected without an approved version). The condition is in the delete itself,
// so an event approved since it was read is left alone
eventRouter.delete('/:id', ...asOrganiser, validate({ params: eventIdParams }), async (req, res) => {
    const row = await findOwnEvent(req.valid.params.id, req.user.userId);
    const [deleted] = await db
        .delete(events)
        .where(and(eq(events.eventId, row.eventId), not(hasBeenPublic)))
        .returning({ eventId: events.eventId });
    if (!deleted) throw new AppError(409, 'This event has been public, so it can only be cancelled.');

    await logAction(LOG.EVENT_DELETED, req.user, { eventId: row.eventId, name: row.eventName });
    res.status(204).end();
});

export default eventRouter;