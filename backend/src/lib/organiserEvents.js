import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '../db/index.js';
import { categories, events, locations } from '../db/schema/index.js';
import { AppError } from './errors.js';
import { lookupPlace } from './osm.js';
import { hasBeenPublic } from './publicEvents.js';

// An organiser's own events (My Events, My Drafts, Organiser Home, Edit Event):
// every status, as the organiser last saved them, not as the public sees them

const fields = {
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
};

function fromOrganiserEvents() {
    return db
        .select(fields)
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

export function wasPublic(row) {
    return ['approved', 'cancelled'].includes(row.status) || Boolean(row.approvedSnapshot);
}

// The category's id from its slug; archived categories take no new events
export async function categoryIdFor(slug) {
    const [category] = await db
        .select({ categoryId: categories.categoryId })
        .from(categories)
        .where(and(eq(categories.slug, slug), eq(categories.isActive, true)));
    if (!category) {
        const message = 'Choose a category from the list.';
        throw new AppError(400, message, [{ path: 'body.category', message }]);
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
        const message = 'Choose a venue in Greater Manchester from the list.';
        throw new AppError(400, message, [{ path: 'body.placeId', message }]);
    }
    // Two organisers adding the same new venue at once: the unique place_id
    // keeps one row, and the second reads it back
    const [added] = await db.insert(locations).values(place).onConflictDoNothing().returning({ locationId: locations.locationId });
    if (added) return added.locationId;
    const [existing] = await db.select({ locationId: locations.locationId }).from(locations).where(eq(locations.placeId, placeId));
    return existing.locationId;
}
