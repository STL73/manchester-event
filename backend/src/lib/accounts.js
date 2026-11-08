import { and, count, desc, eq, getTableColumns, ne, not, sql } from 'drizzle-orm';

import { db } from '../db/index.js';
import { events, users } from '../db/schema/index.js';
import { AppError, isForeignKeyViolation } from './errors.js';
import { deleteImage } from './images.js';
import { hasBeenPublic } from './publicEvents.js';
import { publicUser } from './users.js';

// Manage Users (Phase 8): every account, newest first, with what the panel needs
// to show and decide: how many events an organiser has sent (drafts stay with
// them) and whether any has been public, which rules out deleting the account
export async function listManagedUsers(userId = null) {
    const sent = db
        .select({
            organiserId: sql`${events.organiserId}`.as('sent_organiser_id'),
            eventCount: count().as('event_count'),
            publicCount: sql`count(*) filter (where ${hasBeenPublic})`.as('public_count'),
        })
        .from(events)
        .where(ne(events.status, 'draft'))
        .groupBy(sql`1`)
        .as('sent');

    const rows = await db
        .select({
            ...getTableColumns(users),
            eventCount: sql`coalesce(${sent.eventCount}, 0)`.mapWith(Number),
            publicCount: sql`coalesce(${sent.publicCount}, 0)`.mapWith(Number),
        })
        .from(users)
        .leftJoin(sent, eq(sent.organiserId, users.userId))
        .where(userId === null ? undefined : eq(users.userId, userId))
        .orderBy(desc(users.createdAt), desc(users.userId));

    return rows.map((row) => ({
        ...publicUser(row),
        updatedAt: row.updatedAt,
        eventCount: row.eventCount,
        hasBeenPublic: row.publicCount > 0,
    }));
}

// The schema's deletion rule, for Settings' Delete and Manage Users alike: an
// organiser whose events have been public can only be suspended, since people
// may have saved those events. Their other events go with the account.
// `refusal` is the 409's message, worded for whoever asked. Answers how many
// events went
export async function deleteAccount(user, refusal) {
    const { userId } = user;
    const [publicEvent] = await db
        .select({ eventId: events.eventId })
        .from(events)
        .where(and(eq(events.organiserId, userId), hasBeenPublic))
        .limit(1);
    if (publicEvent) throw new AppError(409, refusal);

    // One batch runs as one transaction. If an event went public since the
    // check, events.organiser_id's RESTRICT stops the user delete and the
    // whole batch is undone. Sessions, tokens, favourites and follows cascade
    let deletedEvents;
    try {
        [deletedEvents] = await db.batch([
            db.delete(events)
                .where(and(eq(events.organiserId, userId), not(hasBeenPublic)))
                .returning({ eventId: events.eventId, imagePublicId: events.imagePublicId }),
            db.delete(users).where(eq(users.userId, userId)),
        ]);
    } catch (error) {
        if (isForeignKeyViolation(error)) throw new AppError(409, refusal);
        throw error;
    }
    // Their pictures go too, once the account is gone (none were ever public)
    await Promise.all([user.avatarPublicId, ...deletedEvents.map((event) => event.imagePublicId)].map(deleteImage));
    return deletedEvents.length;
}
