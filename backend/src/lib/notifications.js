import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '../db/index.js';
import { categoryFollows, events, favourites, notifications, users } from '../db/schema/index.js';
import { NOTIFY } from '../constants/notificationTypes.js';
import { isListed } from './publicEvents.js';

// The in-app inbox (Phase 7, decided 2026-10-05 and 2026-11-03). The rows are
// also the outbox: Phase 11's email job (jobs.js) mails them later, so a
// request never waits on Gmail. Every notification is
// written after the change it reports has gone through, and a failure is logged
// rather than thrown: the decision or the cancel has happened either way

// Who gets it is a query of user ids; each gets their own row, written in one
// INSERT however many there are
async function deliver(recipients, message) {
    try {
        const rows = await recipients;
        if (rows.length === 0) return;
        const { type, eventId = null, subject, body } = message;
        await db.insert(notifications).values(rows.map(({ userId }) => ({ userId, eventId, type, subject, body })));
    } catch (error) {
        console.error(`Notification ${message.type} not written:`, error);
    }
}

export function notifyUser(userId, message) {
    return deliver(
        db.select({ userId: users.userId }).from(users).where(eq(users.userId, userId)),
        message,
    );
}

export function notifyAdmins(message) {
    return deliver(
        db.select({ userId: users.userId }).from(users).where(eq(users.role, 'admin')),
        message,
    );
}

// Everyone who saved the event, suspended or not: it is news about something they kept
export function notifyFavouriters(message) {
    return deliver(
        db
            .select({ userId: favourites.userId })
            .from(favourites)
            .where(eq(favourites.eventId, message.eventId)),
        message,
    );
}

// Users following the category. A new event is an invitation, so a suspended
// account, which can't save it, isn't sent one
export function notifyFollowers(categoryId, message) {
    return deliver(
        db
            .select({ userId: categoryFollows.userId })
            .from(categoryFollows)
            .innerJoin(users, eq(users.userId, categoryFollows.userId))
            .where(and(eq(categoryFollows.categoryId, categoryId), eq(users.role, 'user'), eq(users.accStatus, 'active'))),
        message,
    );
}

// The wording, plain text (the frontend escapes it), close to the PHP's
export const messages = {
    pendingReview: ({ eventId, name }, kind) => ({
        type: NOTIFY.EVENT_PENDING_REVIEW,
        eventId,
        subject: `Awaiting review: ${name}`,
        body: {
            new: `A new event "${name}" has been submitted and is waiting for review.`,
            edit: `"${name}" has been edited and the changes are waiting for review. The approved version stays live until then.`,
            again: `"${name}" has been changed and sent for review again.`,
        }[kind],
    }),
    approved: ({ eventId, name }, wasEdit) => ({
        type: NOTIFY.EVENT_STATUS,
        eventId,
        subject: `Approved: ${name}`,
        body: wasEdit
            ? `Your changes to "${name}" have been approved and are live.`
            : `Your event "${name}" has been approved and is live.`,
    }),
    rejected: ({ eventId, name }, wasEdit, reason) => ({
        type: NOTIFY.EVENT_STATUS,
        eventId,
        subject: `Not approved: ${name}`,
        body: wasEdit
            ? `Your changes to "${name}" weren't approved, so the earlier version stays live. Reason: ${reason}`
            : `Your event "${name}" wasn't approved. Reason: ${reason}`,
    }),
    takenDown: ({ eventId, name }, reason) => ({
        type: NOTIFY.EVENT_STATUS,
        eventId,
        subject: `Cancelled by an admin: ${name}`,
        body: `Your event "${name}" has been cancelled by an admin. Reason: ${reason}`,
    }),
    newInCategory: ({ eventId, name }, categoryName) => ({
        type: NOTIFY.CATEGORY_NEW_EVENT,
        eventId,
        subject: `New Event: ${name}`,
        body: `A new event "${name}" was added to ${categoryName}, one of your interests.`,
    }),
    updated: ({ eventId, name }) => ({
        type: NOTIFY.EVENT_UPDATE,
        eventId,
        subject: `Updated: ${name}`,
        body: `Your favourite event "${name}" has been updated. Check the latest details.`,
    }),
    cancelled: ({ eventId, name }, byAdmin) => ({
        type: NOTIFY.EVENT_CANCELLED,
        eventId,
        subject: `Cancelled: ${name}`,
        body: `Your favourite event "${name}" has been cancelled${byAdmin ? '' : ' by its organiser'}.`,
    }),
    cancelledByOrganiser: ({ eventId, name }, organiserName) => ({
        type: NOTIFY.EVENT_CANCELLED_BY_ORGANISER,
        eventId,
        subject: `Cancelled by organiser: ${name}`,
        body: `The event "${name}" was cancelled by its organiser, ${organiserName}.`,
    }),
    // The same words as the frontend's Settings (profileSettingsData.js)
    passwordChanged: () => ({
        type: NOTIFY.PASSWORD_CHANGED,
        subject: 'Password Changed',
        body: 'Your password was just changed. If this wasn\'t you, contact us straight away.',
    }),
    // Suspension (Phase 8). `until` is a date already worded for the person, or
    // null for until an admin lifts it
    suspended: (until, reason) => ({
        type: NOTIFY.ACCOUNT_STATUS,
        subject: 'Account Suspended',
        body: `Your account has been suspended ${until ? `until ${until}` : 'until an admin lifts it'}. You can still sign in and look around, but you can't make changes. Reason: ${reason}`,
    }),
    reactivated: () => ({
        type: NOTIFY.ACCOUNT_STATUS,
        subject: 'Account Reactivated',
        body: 'Your account is active again. You can make changes as before.',
    }),
    // The saver's reminders (decided 2026-10-11), `when` already worded:
    // "Thursday 12 November at 19:30" and "19:30"
    reminderWeek: ({ eventId, name }, when) => ({
        type: NOTIFY.EVENT_REMINDER_WEEK,
        eventId,
        subject: `A week to go: ${name}`,
        body: `Your favourite event "${name}" is a week away, on ${when}.`,
    }),
    reminderDay: ({ eventId, name }, time) => ({
        type: NOTIFY.EVENT_REMINDER_DAY,
        eventId,
        subject: `Tomorrow: ${name}`,
        body: `Your favourite event "${name}" is tomorrow, starting at ${time}.`,
    }),
    userRegistered: ({ username, email, role }) => ({
        type: NOTIFY.USER_REGISTERED,
        subject: 'New User Registered',
        body: `A new ${role} has registered: ${username} (${email}).`,
    }),
};

// The inbox, newest first. 200 covers months of use; read ones older than 90
// days are cleared by the nightly clean-up (jobs.js)
// `listed` is the lists' rule for the row's event, so User Home's "New in your
// interests" counts only events Explore still shows: a follower who didn't save
// one is never told it was cancelled. False without an event
export function listNotifications(userId, now = new Date()) {
    return db
        .select({
            notificationId: notifications.notificationId,
            eventId: notifications.eventId,
            type: notifications.type,
            subject: notifications.subject,
            body: notifications.body,
            readAt: notifications.readAt,
            createdAt: notifications.createdAt,
            listed: sql`coalesce(${isListed(now)}, false)`.mapWith(Boolean),
        })
        .from(notifications)
        .leftJoin(events, eq(events.eventId, notifications.eventId))
        .leftJoin(users, eq(users.userId, events.organiserId))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt), desc(notifications.notificationId))
        .limit(200);
}

// Only the account's own unread rows change, so an id belonging to someone
// else is simply left alone
export async function markRead(userId, { ids, all }) {
    await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(
            eq(notifications.userId, userId),
            isNull(notifications.readAt),
            all ? undefined : inArray(notifications.notificationId, ids),
        ));
}
