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

// The scheduled jobs (Phase 11, decided 2026-11-05). Each is a plain function
// of `now`, so tests fix the time and `npm run jobs` runs them by hand;
// scheduler.js only decides when. None of them waits for its exact moment:
// each does whatever is due and not yet done, so a server that was asleep at
// 09:00 catches up on its next run, and running twice changes nothing

// Reminders for saved events (decided 2026-10-11): 09:00 London a week before
// the day it starts, and 09:00 the day before. Only events the lists show
// (approved, not started, organiser not suspended), at the time the public
// sees; a reminder whose moment had passed when the event was saved isn't
// sent. Each is sent only on its own day, since the wording counts from it: a
// week one missed until the next day, or a day one until the event's day,
// isn't sent late. The unique index on (user,
// event, type) keeps each to one row, however often this runs
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

// The outbox (decided 2026-11-05): notification rows of the emailed types not
// yet sent, to verified addresses whose owner has email notifications on (or
// any verified address for a security email). A row is claimed before its
// email goes, so two runs at once can't both send it, and given back if the
// email fails, to be tried again next run. After 24 hours it is left to the
// inbox. The first failure ends the run: Gmail refusing one usually means it
// is refusing them all (its limit is about 500 a day), and one log row says so
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

    let sent = 0;
    for (const row of rows) {
        const [claimed] = await db
            .update(notifications)
            .set({ emailSentAt: now })
            .where(and(eq(notifications.notificationId, row.notificationId), isNull(notifications.emailSentAt)))
            .returning({ notificationId: notifications.notificationId });
        if (!claimed) continue;

        try {
            await sendEmail(notificationEmail(row));
            sent += 1;
        } catch (err) {
            await db
                .update(notifications)
                .set({ emailSentAt: null })
                .where(eq(notifications.notificationId, row.notificationId));
            console.error('Notification email failed:', err.message);
            await logAction(LOG.EMAIL_FAILED, row, { email: 'notification', notificationId: row.notificationId, error: err.message });
            return { sent, failed: true };
        }
    }
    return { sent, failed: false };
}

// The nightly clean-up: read notifications after 90 days (decided 2026-10-05),
// contact messages after 12 months (decided 2026-10-05), and sessions and
// email links that have expired, which nothing else removes
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
