import { and, asc, eq, not, sql } from 'drizzle-orm';

import { db } from '../db/index.js';
import { categories, events, locations } from '../db/schema/index.js';
import { AppError, fieldError } from './errors.js';
import { deleteImage } from './images.js';
import { lookupPlace } from './osm.js';
import { hasBeenPublic, wasPublic } from './publicEvents.js';
import { withUpload } from './uploads.js';

// An organiser's own events (My Events, My Drafts, Organiser Home, Edit Event):
// every status, as the organiser last saved them, not as the public sees them

export const eventFields = {
    eventId: events.eventId,
    name: events.eventName,
    description: events.eventDescription,
    startDatetime: events.startDatetime,
    endDatetime: events.endDatetime,
    ticketUrl: events.ticketUrl,
    imageUrl: events.imageUrl,
    status: events.status,
    rejectionReason: events.rejectionReason,
    // Decides Delete or Cancel, as the server will
    hasBeenPublic: sql`${hasBeenPublic}`.mapWith(Boolean),
    // An edit of a live event waiting for review: the public still sees the
    // approved version
    editPending: sql`${events.approvedSnapshot} is not null`.mapWith(Boolean),
    category: { slug: categories.slug, name: categories.name },
    location: {
        placeId: locations.placeId,
        name: locations.locationName,
        address: locations.address,
        area: locations.area,
        latitude: locations.latitude,
        longitude: locations.longitude,
    },
    createdAt: events.createdAt,
    updatedAt: events.updatedAt,
    // When it was last sent for review; Organiser Home counts the days waiting
    organiserUpdatedAt: events.organiserUpdatedAt,
    // When an admin last decided it (not who); Event Analytics' review times
    // and latest rejections read it
    adminUpdatedAt: events.adminUpdatedAt,
};

function fromOrganiserEvents() {
    return db
        .select(eventFields)
        .from(events)
        .innerJoin(categories, eq(categories.categoryId, events.categoryId))
        .innerJoin(locations, eq(locations.locationId, events.locationId))
        .$dynamic();
}

export function listOrganiserEvents(organiserId) {
    return fromOrganiserEvents()
        .where(eq(events.organiserId, organiserId))
        .orderBy(asc(events.startDatetime), asc(events.eventId));
}

export async function findOrganiserEvent(eventId) {
    const [event] = await fromOrganiserEvents().where(eq(events.eventId, eventId));
    return event;
}

// The row itself, only when this organiser owns it. Someone else's event reads
// as not found, so an id can't be used to learn what exists
export async function findOwnEvent(eventId, organiserId) {
    const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.eventId, eventId), eq(events.organiserId, organiserId)));
    if (!event) throw new AppError(404, 'Event not found.');
    return event;
}

// The fields kept in approved_snapshot: the Drizzle names, dates as ISO strings,
// the same as the seed writes and lib/publicEvents.js reads
// (imagePublicId since Phase 6; an older snapshot reads it as NULL, a seed photo)
const SNAPSHOT_KEYS = ['eventName', 'eventDescription', 'startDatetime', 'endDatetime', 'locationId', 'categoryId', 'ticketUrl', 'imageUrl', 'imagePublicId'];

export function snapshotOf(row) {
    return JSON.parse(JSON.stringify(Object.fromEntries(SNAPSHOT_KEYS.map((key) => [key, row[key]]))));
}

// A snapshot back as column values, for Cancel: the approved version is the one cancelled
export function fromSnapshot(snapshot) {
    const row = Object.fromEntries(SNAPSHOT_KEYS.map((key) => [key, snapshot[key] ?? null]));
    row.startDatetime = new Date(row.startDatetime);
    row.endDatetime = row.endDatetime && new Date(row.endDatetime);
    return row;
}

// Over: the version the public sees has ended. An event that was never public
// can't be over, it only expires (a draft may keep a passed date)
export function isOver(row, now = new Date()) {
    if (!['approved', 'cancelled'].includes(row.status) && !row.approvedSnapshot) return false;
    const shown = row.approvedSnapshot && row.status !== 'approved' ? fromSnapshot(row.approvedSnapshot) : row;
    return (shown.endDatetime ?? shown.startDatetime) < now;
}

// The Cloudinary photos a row still shows: its own and its approved version's
function photosOf(row) {
    return [row.imagePublicId, row.approvedSnapshot?.imagePublicId].filter(Boolean);
}

// The photos `before` showed that `after` no longer does, to delete once the
// write has gone through. An edit of a live event moves the old photo into the
// snapshot, so it stays until the edit is approved or the event cancelled
export function droppedPhotos(before, after) {
    const kept = new Set(photosOf(after));
    return [...new Set(photosOf(before))].filter((publicId) => !kept.has(publicId));
}

// The category's id from its slug; archived categories take no new events
export async function categoryIdFor(slug) {
    const [category] = await db
        .select({ categoryId: categories.categoryId })
        .from(categories)
        .where(and(eq(categories.slug, slug), eq(categories.isActive, true)));
    if (!category) {
        throw fieldError(400, 'category', 'Choose a category from the list.');
    }
    return category.categoryId;
}

// The venue's row, added from OpenStreetMap the first time anyone picks it.
// Venues are shared: later events at the same place reuse the row
export async function locationIdFor(placeId) {
    const [known] = await db.select({ locationId: locations.locationId }).from(locations).where(eq(locations.placeId, placeId));
    if (known) return known.locationId;

    const place = await lookupPlace(placeId);
    if (!place) {
        throw fieldError(400, 'placeId', 'Choose a venue in Greater Manchester from the list.');
    }
    // Two organisers adding the same new venue at once: the unique place_id
    // keeps one row, and the second reads it back
    const [added] = await db.insert(locations).values(place).onConflictDoNothing().returning({ locationId: locations.locationId });
    if (added) return added.locationId;
    const [existing] = await db.select({ locationId: locations.locationId }).from(locations).where(eq(locations.placeId, placeId));
    return existing.locationId;
}

// The category's name, for its followers' notification
export async function categoryName(categoryId) {
    const [category] = await db.select({ name: categories.name }).from(categories).where(eq(categories.categoryId, categoryId));
    return category.name;
}

// Organisers' own events (Phase 5, decided 2026-10-05 and 2026-11-02). The
// routes have found the row with findOwnEvent, so every write is the owner's

// Sending an event for approval: the email must be verified (the one thing an
// unverified account can't do), and the start still to come. The start is
// checked when it is new to the admin: a draft being sent, or a changed time.
// A live event that has started and keeps its time can still be edited
function checkSubmittable(user, startDatetime, startIsNew, now) {
    if (!user.emailVerifiedAt) {
        throw new AppError(403, 'Verify your email address before sending an event for approval.');
    }
    if (startIsNew && startDatetime < now) {
        throw fieldError(400, 'startDatetime', 'The start has passed. Pick a time still to come.');
    }
}

// The body's fields as columns
async function columnsFrom({ eventName, category, description, startDatetime, endDatetime, placeId, ticketUrl }) {
    const [categoryId, locationId] = await Promise.all([categoryIdFor(category), locationIdFor(placeId)]);
    return { eventName, eventDescription: description, startDatetime, endDatetime, categoryId, locationId, ticketUrl };
}

// The photo's columns: a new upload, the default one (removeImage), or unchanged
function imageColumns(uploaded, removeImage) {
    if (uploaded) return { imageUrl: uploaded.url, imagePublicId: uploaded.publicId };
    return removeImage ? { imageUrl: null, imagePublicId: null } : {};
}

// Create Event: Save draft, or Submit for approval. The photo is uploaded only
// once every check has passed
export async function createEvent(user, body, file) {
    const now = new Date();
    if (body.submit) checkSubmittable(user, body.startDatetime, true, now);
    const columns = await columnsFrom(body);

    return withUpload(file, 'image', async (uploaded) => {
        const [inserted] = await db
            .insert(events)
            .values({
                ...columns,
                ...imageColumns(uploaded, false),
                organiserId: user.userId,
                status: body.submit ? 'pending' : 'draft',
                organiserUpdatedAt: body.submit ? now : null,
            })
            .returning();
        return inserted;
    });
}

// Edit Event, answering the new status. A draft stays a draft unless sent;
// anything else goes to pending for an admin to approve again. Editing a live
// event keeps its approved version public, with its favourites, until the edit
// is approved (option b, 2026-10-05): the first edit copies it into
// approved_snapshot, later edits before the review leave that copy alone,
// photo included. Cancelled and ended events are final
export async function editEvent(row, user, body, file) {
    const now = new Date();
    if (row.status === 'cancelled') throw new AppError(400, 'A cancelled event can\'t be edited.');
    if (isOver(row, now)) throw new AppError(400, 'This event has ended, so it can\'t be edited.');

    const status = row.status === 'draft' && !body.submit ? 'draft' : 'pending';
    if (status === 'pending') {
        const startIsNew = row.status === 'draft' || body.startDatetime.getTime() !== row.startDatetime.getTime();
        checkSubmittable(user, body.startDatetime, startIsNew, now);
    }

    const changes = {
        ...(await columnsFrom(body)),
        status,
        approvedSnapshot: row.status === 'approved' ? snapshotOf(row) : row.approvedSnapshot,
        // Draft saves don't count as the organiser updating it
        organiserUpdatedAt: status === 'pending' ? now : row.organiserUpdatedAt,
    };
    const saved = await withUpload(file, 'image', async (uploaded) => {
        const set = { ...changes, ...imageColumns(uploaded, body.removeImage) };
        await db.update(events).set(set).where(eq(events.eventId, row.eventId));
        return set;
    });
    await Promise.all(droppedPhotos(row, { ...row, ...saved }).map(deleteImage));
    return status;
}

// My Drafts' Submit for approval, without opening the form
export async function submitDraft(row, user) {
    const now = new Date();
    if (row.status !== 'draft') throw new AppError(400, 'Only a draft can be sent for approval.');
    checkSubmittable(user, row.startDatetime, true, now);
    await db.update(events).set({ status: 'pending', organiserUpdatedAt: now }).where(eq(events.eventId, row.eventId));
}

// Cancel, for an event that has been public: people may have saved it, so it
// stays, marked cancelled. An edit still waiting is dropped and the approved
// version is the one cancelled, since that's what people saw. Answers the
// cancelled version's name
export async function cancelEvent(row) {
    if (!wasPublic(row)) throw new AppError(400, 'This event has never been public, so delete it instead.');
    if (row.status === 'cancelled') throw new AppError(400, 'This event is already cancelled.');
    if (isOver(row)) throw new AppError(400, 'This event has ended, so it can\'t be cancelled.');

    const restored = row.approvedSnapshot ? fromSnapshot(row.approvedSnapshot) : {};
    // A reason on a cancelled event means an admin took it down, so an old
    // rejection of a waiting edit doesn't stay
    const set = { ...restored, status: 'cancelled', approvedSnapshot: null, rejectionReason: null, organiserUpdatedAt: new Date() };
    await db.update(events).set(set).where(eq(events.eventId, row.eventId));
    // The waiting edit's photo, if it had its own
    await Promise.all(droppedPhotos(row, { ...row, ...set }).map(deleteImage));
    return restored.eventName ?? row.eventName;
}

// Delete, only for an event that has never been public (draft, pending or
// rejected without an approved version). The condition is in the delete itself,
// so an event approved since it was read is left alone
export async function deleteEvent(row) {
    const [deleted] = await db
        .delete(events)
        .where(and(eq(events.eventId, row.eventId), not(hasBeenPublic)))
        .returning({ eventId: events.eventId, imagePublicId: events.imagePublicId });
    if (!deleted) throw new AppError(409, 'This event has been public, so it can only be cancelled.');
    await deleteImage(deleted.imagePublicId);
}
