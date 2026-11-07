import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import { categories, events, locations, users } from '../db/schema/index.js';
import { AppError } from './errors.js';
import { eventFields } from './organiserEvents.js';

// The admin's Manage Events and Admin Home (Phase 7): every event but drafts,
// which stay the organiser's own until sent. Each is the latest version, as
// the organiser saved it, with the approved version beside it when an edit of
// a live event is waiting, so the panel can show what changed

const admins = alias(users, 'admins');

// An approved_snapshot in the list's shape. It keeps ids (the columns'), so the
// category and venue are looked up, from maps made once for the whole list
function snapshotView(snapshot, categoriesById, locationsById) {
    const category = categoriesById.get(snapshot.categoryId);
    const location = locationsById.get(snapshot.locationId);
    return {
        name: snapshot.eventName,
        description: snapshot.eventDescription,
        startDatetime: snapshot.startDatetime,
        endDatetime: snapshot.endDatetime,
        ticketUrl: snapshot.ticketUrl,
        imageUrl: snapshot.imageUrl,
        category: category && { slug: category.slug, name: category.name },
        location: location && { placeId: location.placeId, name: location.locationName, address: location.address, area: location.area },
    };
}

// One event (after a decision) or all of them
export async function listManagedEvents(eventId = null) {
    const rows = await db
        .select({
            ...eventFields,
            organiser: { userId: users.userId, username: users.username },
            // Who decided last, so the page can say "by you"
            adminId: events.adminUpdatedBy,
            adminName: admins.username,
            approvedSnapshot: events.approvedSnapshot,
        })
        .from(events)
        .innerJoin(categories, eq(categories.categoryId, events.categoryId))
        .innerJoin(locations, eq(locations.locationId, events.locationId))
        .innerJoin(users, eq(users.userId, events.organiserId))
        .leftJoin(admins, eq(admins.userId, events.adminUpdatedBy))
        .where(and(ne(events.status, 'draft'), eventId ? eq(events.eventId, eventId) : undefined))
        .orderBy(desc(events.createdAt), desc(events.eventId));

    const snapshots = rows.map((row) => row.approvedSnapshot).filter(Boolean);
    if (snapshots.length === 0) return rows;

    const [snapshotCategories, snapshotLocations] = await Promise.all([
        db.select().from(categories).where(inArray(categories.categoryId, snapshots.map((s) => s.categoryId))),
        db.select().from(locations).where(inArray(locations.locationId, snapshots.map((s) => s.locationId))),
    ]);
    const categoriesById = new Map(snapshotCategories.map((row) => [row.categoryId, row]));
    const locationsById = new Map(snapshotLocations.map((row) => [row.locationId, row]));
    return rows.map((row) => ({
        ...row,
        approvedSnapshot: row.approvedSnapshot && snapshotView(row.approvedSnapshot, categoriesById, locationsById),
    }));
}

// The row itself for a decision. A draft reads as not found: admins never see one
export async function findManagedEvent(eventId) {
    const [row] = await db
        .select()
        .from(events)
        .where(and(eq(events.eventId, eventId), ne(events.status, 'draft')));
    if (!row) throw new AppError(404, 'Event not found.');
    return row;
}
