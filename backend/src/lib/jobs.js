import { and, asc, eq, gte, inArray, isNotNull, isNull, lt, lte, or } from 'drizzle-orm';

import { db } from '../db/index.js';
import { authTokens, contactMessages, events, favourites, notifications, sessions, users } from '../db/schema/index.js';
import { ALWAYS_EMAILED_TYPES, EMAILED_TYPES } from '../constants/notificationTypes.js';
import { LOG } from '../constants/logActions.js';
import { sendEmail } from './email.js';
import { DAY, formatDateTime, formatTime, londonDay, londonInstant, londonParts } from './londonTime.js';
import { messages } from './notifications.js';
import { notificationEmail } from './notificationEmails.js';
import { isListed, pub } from './publicEvents.js';
import { logAction } from './systemLogs.js';

// The scheduled jobs, each a function of `now`; scheduler.js decides when. Each
// does whatever is due and not yet done, so a missed run catches up

// Reminders for saved events, at 09:00 London a week before and the day before.
// Each goes only on its own day, since the wording counts from it, and only once
export async function sendReminders(now = new Date()) {
    // Only events starting before midnight a week on can have one due today.
    // One already started needs no check here: its reminders' days are over
    const rows = await db
        .select({
            userId: favourites.userId,
            savedAt: favourites.createdAt,
            eventId: events.eventId,
            name: pub.name,
            startDatetime: pub.startDatetime,
        })
        .from(favourites)
        .innerJoin(events, eq(events.eventId, favourites.eventId))
        .innerJoin(users, eq(users.userId, events.organiserId))
        .where(and(isListed(now), lt(pub.startDatetime, londonDay(now, 8))));

    const reminders = [];
    for (const row of rows) {
        const [year, month, day] = londonParts(row.startDatetime);
        const dayDue = londonInstant(year, month, day - 1, 9);
        const weekDue = londonInstant(year, month, day - 7, 9);
        const startDay = londonInstant(year, month, day);
        if (now >= dayDue) {
            if (now < startDay && row.savedAt < dayDue) reminders.push({ userId: row.userId, ...messages.reminderDay(row, formatTime(row.startDatetime)) });
        } else if (now >= weekDue && now < londonInstant(year, month, day - 6) && row.savedAt < weekDue) {
            reminders.push({ userId: row.userId, ...messages.reminderWeek(row, formatDateTime(row.startDatetime)) });
        }
    }
    if (reminders.length === 0) return { reminders: 0 };

    const written = await db
        .insert(notifications)
        .values(reminders)
        .onConflictDoNothing()
        .returning({ notificationId: notifications.notificationId });
    return { reminders: written.length };
}

// Emails the notifications due, claiming the batch in one UPDATE so two runs
// can't both send one. A failure gives back the rest and ends the run
export async function sendNotificationEmails(now = new Date(), limit = 100) {
    const rows = await db
        .select({
            notificationId: notifications.notificationId,
            eventId: notifications.eventId,
            type: notifications.type,
            subject: notifications.subject,
            body: notifications.body,
            userId: users.userId,
            username: users.username,
            email: users.email,
            role: users.role,
        })
        .from(notifications)
        .innerJoin(users, eq(users.userId, notifications.userId))
        .where(and(
            isNull(notifications.emailSentAt),
            gte(notifications.createdAt, new Date(now.getTime() - DAY)),
            inArray(notifications.type, EMAILED_TYPES),
            isNotNull(users.emailVerifiedAt),
            or(eq(users.emailNotifications, true), inArray(notifications.type, ALWAYS_EMAILED_TYPES)),
        ))
        .orderBy(asc(notifications.createdAt), asc(notifications.notificationId))
        .limit(limit);

    if (rows.length === 0) return { sent: 0, failed: false };

    // Rows another run claimed after the read above don't come back
    const claimed = new Set((await db
        .update(notifications)
        .set({ emailSentAt: now })
        .where(and(inArray(notifications.notificationId, rows.map((row) => row.notificationId)), isNull(notifications.emailSentAt)))
        .returning({ notificationId: notifications.notificationId }))
        .map((row) => row.notificationId));
    const batch = rows.filter((row) => claimed.has(row.notificationId));

    for (const [sent, row] of batch.entries()) {
        try {
            await sendEmail(notificationEmail(row));
        } catch (err) {
            await db
                .update(notifications)
                .set({ emailSentAt: null })
                .where(inArray(notifications.notificationId, batch.slice(sent).map((unsent) => unsent.notificationId)));
            console.error('Notification email failed:', err.message);
            await logAction(LOG.EMAIL_FAILED, row, { email: 'notification', notificationId: row.notificationId, error: err.message });
            return { sent, failed: true };
        }
    }
    return { sent: batch.length, failed: false };
}

// The nightly clean-up: read notifications after 90 days, contact messages
// after 12 months, and expired sessions and email links
export async function cleanUp(now = new Date()) {
    const yearAgo = new Date(now);
    yearAgo.setUTCMonth(yearAgo.getUTCMonth() - 12);

    const [readNotifications, oldMessages, oldSessions, oldTokens] = await db.batch([
        db.delete(notifications)
            .where(lt(notifications.readAt, new Date(now.getTime() - 90 * DAY)))
            .returning({ id: notifications.notificationId }),
        db.delete(contactMessages)
            .where(lt(contactMessages.createdAt, yearAgo))
            .returning({ id: contactMessages.messageId }),
        // Still valid while expires_at > now (sessions.js, authTokens.js)
        db.delete(sessions).where(lte(sessions.expiresAt, now)).returning({ id: sessions.sessionId }),
        db.delete(authTokens).where(lte(authTokens.expiresAt, now)).returning({ id: authTokens.tokenHash }),
    ]);
    return {
        notifications: readNotifications.length,
        contactMessages: oldMessages.length,
        sessions: oldSessions.length,
        authTokens: oldTokens.length,
    };
}
