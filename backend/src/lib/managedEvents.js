import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import { categories, events, locations, users } from '../db/schema/index.js';
import { AppError } from './errors.js';
import { deleteImage } from './images.js';
import { droppedPhotos, eventFields, isOver } from './organiserEvents.js';

// The admin's list (Manage Events, Admin Home): every event but drafts, as last
// saved, with the approved version beside a waiting edit to show what changed

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

// Admins' decisions. The status read is part of each UPDATE, so a second admin
// deciding at the same moment gets 409

// Only a waiting event is decided. One never public whose start has passed is
// Expired; a live event's edit can be decided until the live version ends
function checkDecidable(row, now) {
    if (row.status !== 'pending') throw new AppError(400, 'Only an event waiting for review can be approved or rejected.');
    const expired = row.approvedSnapshot ? isOver(row, now) : row.startDatetime < now;
    if (expired) throw new AppError(400, 'This event\'s time has passed, so it can no longer be reviewed.');
}

async function decide(row, admin, now, set) {
    const [saved] = await db
        .update(events)
        .set({ ...set, adminUpdatedAt: now, adminUpdatedBy: admin.userId })
        .where(and(eq(events.eventId, row.eventId), eq(events.status, row.status)))
        .returning();
    if (!saved) throw new AppError(409, 'This event changed while you were deciding. Reload to see it as it is now.');
    return saved;
}

// Approve. An edit of a live event replaces the live version, so its approved
// copy goes, and with it the copy's photo if the edit brought its own
export async function approveEvent(row, admin) {
    const now = new Date();
    checkDecidable(row, now);
    const saved = await decide(row, admin, now, { status: 'approved', approvedSnapshot: null, rejectionReason: null });
    await Promise.all(droppedPhotos(row, saved).map(deleteImage));
    return saved;
}

// Reject, with the reason the organiser reads. A rejected edit of a live
// event keeps its approved copy, so the public still sees that version
export async function rejectEvent(row, reason, admin) {
    const now = new Date();
    checkDecidable(row, now);
    return decide(row, admin, now, { status: 'rejected', rejectionReason: reason });
}

// Takes a live event down: cancelled, as if by its organiser, since a public
// event is never hidden as if it hadn't been. The reason is kept for them
export async function takeDownEvent(row, reason, admin) {
    const now = new Date();
    if (row.status !== 'approved') throw new AppError(400, 'Only a live event can be taken down.');
    if (isOver(row, now)) throw new AppError(400, 'This event has ended, so it can\'t be cancelled.');
    return decide(row, admin, now, { status: 'cancelled', rejectionReason: reason });
}
