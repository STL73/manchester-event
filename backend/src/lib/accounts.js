import { and, count, desc, eq, getTableColumns, ne, not, sql } from 'drizzle-orm';

import { db } from '../db/index.js';
import { events, users } from '../db/schema/index.js';
import { AppError, fieldError, isForeignKeyViolation } from './errors.js';
import { deleteImage } from './images.js';
import { DAY } from './londonTime.js';
import { hasBeenPublic } from './publicEvents.js';

// What the frontend may see of an account: everything but the password hash
export function publicUser(user) {
    return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        accStatus: user.accStatus,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
        emailNotifications: user.emailNotifications,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };
}

// Who a new event in a followed category reaches: active user accounts.
// notifyFollowers() sends to them and the analytics pages count them
export const reachableUser = and(eq(users.role, 'user'), eq(users.accStatus, 'active'));

const notSuspended = { accStatus: 'active', suspendedUntil: null, suspensionReason: null };

// A suspension with an end date ends by itself: it's lifted the first time the
// account is seen after that date, so no scheduled job is needed for it
export async function liftExpiredSuspension(user) {
    if (user.accStatus !== 'suspended' || !user.suspendedUntil || user.suspendedUntil > new Date()) return user;
    const [lifted] = await db.update(users).set(notSuspended).where(eq(users.userId, user.userId)).returning();
    return lifted;
}

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

// The account an admin is changing. Never your own (Settings is for that) and
// never an admin's (decided 2026-11-03)
export async function findManagedAccount(adminId, userId) {
    if (userId === adminId) throw new AppError(400, 'This is your account. Change it on Settings.');
    const [account] = await db.select().from(users).where(eq(users.userId, userId));
    if (!account) throw new AppError(404, 'Account not found.');
    if (account.role === 'admin') throw new AppError(403, 'Admin accounts can\'t be changed here.');
    // A suspension whose end has passed is over, whatever the row still says
    return liftExpiredSuspension(account);
}

// Answers false for an account already active: nothing changed, so nothing to log or tell
export async function reactivateAccount(account) {
    if (account.accStatus === 'active') return false;
    await db.update(users).set(notSuspended).where(eq(users.userId, account.userId));
    return true;
}

// `days` is 7, 30 or null (until lifted); left out, the current end is kept,
// which only a suspended account has. Answers the end, null for none
export async function suspendAccount(account, { days, reason }) {
    let until;
    if (days === undefined) {
        if (account.accStatus !== 'suspended') throw fieldError(400, 'days', 'Choose how long.');
        until = account.suspendedUntil;
    } else {
        until = days ? new Date(Date.now() + days * DAY) : null;
    }
    await db
        .update(users)
        .set({ accStatus: 'suspended', suspendedUntil: until, suspensionReason: reason })
        .where(eq(users.userId, account.userId));
    return until;
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
