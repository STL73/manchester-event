import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { and, asc, eq, inArray, like } from 'drizzle-orm';

import { db } from '../src/db/index.js';
import {
    users, events, categories, locations, favourites, notifications, contactMessages, sessions, authTokens, systemLogs,
} from '../src/db/schema/index.js';
import { LOG } from '../src/constants/logActions.js';
import { londonDay } from '../src/lib/londonTime.js';
import { sendEmail } from '../src/lib/email.js';
import { cleanUp, sendNotificationEmails, sendReminders } from '../src/lib/jobs.js';
import { runJob } from '../src/lib/scheduler.js';
import { DAY, HOUR, insertAccounts, testEmail } from './helpers.js';

// No email leaves the tests: the email job's sends land here
vi.mock('../src/lib/email.js', () => ({ sendEmail: vi.fn() }));

// The jobs work over the whole table, and other test files write rows at the
// same moment, so every check below reads only the rows of this file's
// accounts (PREFIX). "Now" is today at 12:00 in London, so the 09:00
// reminders are due whatever time the suite runs
const PREFIX = 'jobs-test-';
const NOW = londonDay(new Date(), 0, 12);

const ids = {};
const email = (name) => testEmail(PREFIX, name);

beforeAll(async () => {
    const [category] = await db.insert(categories).values({ slug: `${PREFIX}cat`, name: `${PREFIX}cat` }).returning();
    const [venue] = await db
        .insert(locations)
        .values({ placeId: `${PREFIX}venue`, locationName: 'Test Hall', address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();

    Object.assign(ids, await insertAccounts(PREFIX, [
        ['organiser', 'organiser'],
        ['saver', 'user'],
        ['late', 'user'],
        ['off', 'user', { emailNotifications: false }],
        ['unverified', 'user', { emailVerifiedAt: null }],
        ['admin', 'admin'],
        ['broken', 'user'],
    ]));

    // Each event starts at 19:30 London `days` from today
    const event = (key, days, extra = {}) => ({
        organiserId: ids.organiser,
        eventName: `${PREFIX}${key}`,
        eventDescription: 'A test event.',
        startDatetime: londonDay(NOW, days, 19, 30),
        locationId: venue.locationId,
        categoryId: category.categoryId,
        status: 'approved',
        ...extra,
    });
    const created = await db
        .insert(events)
        .values([
            event('week', 7),
            event('tomorrow', 1),
            event('between', 3),
            event('cancelled', 1, { status: 'cancelled' }),
            event('pending', 1, { status: 'pending' }),
            // An edit waiting for review moved it to three days away; the
            // public still sees the approved version, tomorrow
            event('edited', 3, {
                status: 'pending',
                approvedSnapshot: { eventName: `${PREFIX}edited approved`, startDatetime: londonDay(NOW, 1, 19, 30).toISOString() },
            }),
        ])
        .returning();
    for (const row of created) ids[row.eventName.slice(PREFIX.length)] = row.eventId;

    // Saved a month ago, before every reminder fell due; `late` saved two
    // events at 10:00 today, after their 09:00 reminders
    const longAgo = new Date(NOW.getTime() - 30 * DAY);
    await db.insert(favourites).values([
        ...['week', 'tomorrow', 'between', 'cancelled', 'pending', 'edited']
            .map((key) => ({ userId: ids.saver, eventId: ids[key], createdAt: longAgo })),
        { userId: ids.late, eventId: ids.week, createdAt: londonDay(NOW, 0, 10) },
        { userId: ids.late, eventId: ids.tomorrow, createdAt: londonDay(NOW, 0, 10) },
    ]);
});

afterAll(async () => {
    const mine = like(users.username, `${PREFIX}%`);
    const accountIds = (await db.select({ userId: users.userId }).from(users).where(mine)).map((row) => row.userId);
    await db.delete(systemLogs).where(inArray(systemLogs.userId, accountIds));
    await db.delete(contactMessages).where(like(contactMessages.name, `${PREFIX}%`));
    // Notifications, favourites, sessions and tokens go with the accounts
    await db.delete(events).where(like(events.eventName, `${PREFIX}%`));
    await db.delete(users).where(mine);
    await db.delete(locations).where(eq(locations.placeId, `${PREFIX}venue`));
    await db.delete(categories).where(eq(categories.slug, `${PREFIX}cat`));
});

const inboxOf = (...names) => db
    .select()
    .from(notifications)
    .where(inArray(notifications.userId, names.map((name) => ids[name])))
    .orderBy(asc(notifications.notificationId));

describe('event reminders', () => {
    it('sends none late: a week one after its day, a day one on the event day', async () => {
        // Tomorrow at 08:00: the week-away reminder's day is over, and the
        // tomorrow event's day has come
        await sendReminders(londonDay(NOW, 1, 8));
        expect(await inboxOf('saver', 'late')).toEqual([]);
    });

    it('sends none before 09:00', async () => {
        await sendReminders(londonDay(NOW, 0, 8, 59));
        expect(await inboxOf('saver', 'late')).toEqual([]);
    });

    it('sends the reminders due, once each, to people who saved before they fell due', async () => {
        await sendReminders(NOW);
        const rows = await inboxOf('saver', 'late');
        // Not `late`, not the event three days away, not the cancelled or
        // pending ones; the edited one at the time and name the public sees
        expect(rows).toHaveLength(3);
        expect(rows.map(({ userId, eventId, type }) => ({ userId, eventId, type }))).toEqual(expect.arrayContaining([
            { userId: ids.saver, eventId: ids.week, type: 'event_reminder_week' },
            { userId: ids.saver, eventId: ids.tomorrow, type: 'event_reminder_day' },
            { userId: ids.saver, eventId: ids.edited, type: 'event_reminder_day' },
        ]));
        expect(rows.find((row) => row.eventId === ids.edited).subject).toBe(`Tomorrow: ${PREFIX}edited approved`);

        const week = rows.find((row) => row.eventId === ids.week);
        expect(week.subject).toBe(`A week to go: ${PREFIX}week`);
        expect(week.body).toMatch(/is a week away, on \w+day \d+ \w+ at 19:30\.$/);
        const day = rows.find((row) => row.eventId === ids.tomorrow);
        expect(day.subject).toBe(`Tomorrow: ${PREFIX}tomorrow`);
        expect(day.body).toContain('is tomorrow, starting at 19:30.');
    });

    it('writes nothing more when it runs again', async () => {
        await sendReminders(NOW);
        await sendReminders(new Date(NOW.getTime() + HOUR));
        expect(await inboxOf('saver', 'late')).toHaveLength(3);
    });
});

describe('notification emails', () => {
    const row = (name, type, extra = {}) => ({
        userId: ids[name], type, subject: `${PREFIX}${name} ${type}`, body: `Body for ${name} <b>`, ...extra,
    });
    const sentTo = (name) => vi.mocked(sendEmail).mock.calls.map(([message]) => message).filter((message) => message.to === email(name));

    beforeEach(() => {
        vi.mocked(sendEmail).mockReset();
    });

    it('emails the rows due and marks them sent', async () => {
        const [update, security, off, unverified, registered, old, password] = await db
            .insert(notifications)
            .values([
                row('saver', 'event_update', { eventId: ids.week }),
                row('off', 'account_status'),
                row('off', 'event_update', { eventId: ids.week }),
                row('unverified', 'event_update', { eventId: ids.week }),
                row('admin', 'user_registered'),
                row('saver', 'event_cancelled', { createdAt: new Date(NOW.getTime() - 25 * HOUR) }),
                // Has its own email already (authEmails.js)
                row('saver', 'password_changed'),
            ])
            .returning();

        const result = await sendNotificationEmails(NOW, 10000);
        expect(result.failed).toBe(false);

        // The reminders from above, then the update
        const saver = sentTo('saver');
        expect(saver.map((message) => message.subject)).toEqual([
            ...(await inboxOf('saver')).filter((n) => n.type.startsWith('event_reminder')).map((n) => n.subject),
            update.subject,
        ]);
        const message = saver.at(-1);
        expect(message.text).toContain(`Body for saver <b>`);
        expect(message.text).toContain(`/dashboard/events/${ids.week}`);
        expect(message.text).toContain('turn them off in Settings');
        expect(message.html).toContain('Body for saver &#60;b&#62;');

        // Switched off: only the security email, without the "turn off" line
        expect(sentTo('off').map((m) => m.subject)).toEqual([security.subject]);
        expect(sentTo('off')[0].text).toContain('/dashboard/notifications');
        expect(sentTo('off')[0].text).not.toContain('turn them off');
        expect(sentTo('unverified')).toEqual([]);
        expect(sentTo('admin')).toEqual([]);

        const stored = Object.fromEntries((await inboxOf('saver', 'off', 'unverified', 'admin'))
            .map((n) => [n.notificationId, n.emailSentAt]));
        expect(stored[update.notificationId]).toEqual(NOW);
        expect(stored[security.notificationId]).toEqual(NOW);
        for (const skipped of [off, unverified, registered, old, password]) expect(stored[skipped.notificationId]).toBeNull();
    });

    it('sends nothing twice', async () => {
        await sendNotificationEmails(NOW, 10000);
        expect(sentTo('saver')).toEqual([]);
        expect(sentTo('off')).toEqual([]);
    });

    // Two runs at once, forced to interleave: run A has read both rows and is
    // held before its claim reaches Neon; run B reads, claims and sends them;
    // A, let go, must find them claimed and send nothing. Left to timing, B's
    // read came after A's claim and the race never happened. The neon-http
    // driver sends each query through globalThis.fetch when it runs, which is
    // where A is held
    it('sends a row once when two runs overlap', async () => {
        await db.insert(notifications).values([
            row('late', 'event_update', { eventId: ids.week, subject: `${PREFIX}first` }),
            row('late', 'event_update', { eventId: ids.week, subject: `${PREFIX}second` }),
        ]);
        let release;
        const held = new Promise((resolve) => { release = resolve; });
        let claimHeld = false;
        const realFetch = globalThis.fetch;
        globalThis.fetch = async (url, options) => {
            if (!claimHeld && String(options?.body).includes('update \\"notifications\\" set \\"email_sent_at\\"')) {
                claimHeld = true;
                await held;
            }
            return realFetch(url, options);
        };

        try {
            const runA = sendNotificationEmails(NOW, 10000);
            await vi.waitFor(() => expect(claimHeld).toBe(true));
            await sendNotificationEmails(NOW, 10000);
            expect(sentTo('late').map((m) => m.subject)).toEqual([`${PREFIX}first`, `${PREFIX}second`]);
            release();
            await runA;
        } finally {
            globalThis.fetch = realFetch;
        }

        expect(sentTo('late').map((m) => m.subject)).toEqual([`${PREFIX}first`, `${PREFIX}second`]);
    });

    // In the batch's order: `before` is sent, `failing` fails, `after` is
    // never tried. Both of the last two go back, and `before` stays sent
    it('gives the failed row and the rest back, logs it, stops, and sends them next run', async () => {
        const [before, failing, after] = await db
            .insert(notifications)
            .values([
                row('saver', 'event_update', { eventId: ids.week, createdAt: new Date(NOW.getTime() - 3 * HOUR) }),
                row('broken', 'event_update', { eventId: ids.week, createdAt: new Date(NOW.getTime() - 2 * HOUR) }),
                row('broken', 'event_cancelled', { eventId: ids.week, createdAt: new Date(NOW.getTime() - HOUR) }),
            ])
            .returning();
        vi.mocked(sendEmail).mockImplementation(async (message) => {
            if (message.to === email('broken')) throw new Error('SMTP down');
        });

        expect(await sendNotificationEmails(NOW, 10000)).toMatchObject({ failed: true });
        const stored = Object.fromEntries((await inboxOf('saver', 'broken')).map((n) => [n.notificationId, n.emailSentAt]));
        expect(stored[before.notificationId]).toEqual(NOW);
        expect(stored[failing.notificationId]).toBeNull();
        expect(stored[after.notificationId]).toBeNull();
        expect(sentTo('broken')).toHaveLength(1);
        const logs = await db
            .select()
            .from(systemLogs)
            .where(and(eq(systemLogs.userId, ids.broken), eq(systemLogs.action, LOG.EMAIL_FAILED)));
        expect(logs.map((log) => log.details)).toEqual([
            { email: 'notification', notificationId: failing.notificationId, error: 'SMTP down' },
        ]);

        vi.mocked(sendEmail).mockReset();
        await sendNotificationEmails(NOW, 10000);
        expect(sentTo('broken').map((m) => m.subject)).toEqual([failing.subject, after.subject]);
        const sent = await inboxOf('broken');
        expect(sent.map((n) => n.emailSentAt)).toEqual([NOW, NOW]);
    });

    // A row exactly 24 hours old is the oldest any run can see, so with a
    // limit of 1 it is the one sent, and the next oldest is left unclaimed
    it('sends up to the limit, oldest first, and claims no more', async () => {
        const [edge, next] = await db
            .insert(notifications)
            .values([
                row('saver', 'event_update', { eventId: ids.week, subject: `${PREFIX}edge`, createdAt: new Date(NOW.getTime() - DAY) }),
                row('saver', 'event_update', { eventId: ids.week, subject: `${PREFIX}next`, createdAt: new Date(NOW.getTime() - DAY + 1000) }),
            ])
            .returning();

        expect(await sendNotificationEmails(NOW, 1)).toEqual({ sent: 1, failed: false });
        expect(vi.mocked(sendEmail).mock.calls.map(([message]) => message.subject)).toEqual([edge.subject]);
        const stored = Object.fromEntries((await inboxOf('saver')).map((n) => [n.notificationId, n.emailSentAt]));
        expect(stored[edge.notificationId]).toEqual(NOW);
        expect(stored[next.notificationId]).toBeNull();
    });
});

describe('clean-up', () => {
    it('deletes old read notifications and messages, and expired sessions and links', async () => {
        const now = new Date();
        const daysAgo = (days) => new Date(now.getTime() - days * DAY);
        const monthsAgo = (months) => {
            const date = new Date(now);
            date.setUTCMonth(date.getUTCMonth() - months);
            return date;
        };

        const old = await db
            .insert(notifications)
            .values([
                { userId: ids.admin, type: 'user_registered', subject: 'read91', body: '-', readAt: daysAgo(91), createdAt: daysAgo(100) },
                { userId: ids.admin, type: 'user_registered', subject: 'read89', body: '-', readAt: daysAgo(89), createdAt: daysAgo(100) },
                { userId: ids.admin, type: 'user_registered', subject: 'unread', body: '-', createdAt: daysAgo(200) },
            ])
            .returning();
        const message = (key, createdAt) => ({ name: `${PREFIX}${key}`, email: email(key), message: '-', createdAt });
        await db.insert(contactMessages).values([message('13months', monthsAgo(13)), message('11months', monthsAgo(11))]);
        await db.insert(sessions).values([
            { sessionId: `${PREFIX}expired`, userId: ids.admin, expiresAt: daysAgo(1) },
            { sessionId: `${PREFIX}valid`, userId: ids.admin, expiresAt: new Date(now.getTime() + DAY) },
        ]);
        await db.insert(authTokens).values([
            { tokenHash: `${PREFIX}expired`, userId: ids.admin, purpose: 'password_reset', expiresAt: daysAgo(1) },
            { tokenHash: `${PREFIX}valid`, userId: ids.admin, purpose: 'email_verification', expiresAt: new Date(now.getTime() + DAY) },
        ]);

        const result = await cleanUp(now);
        for (const count of Object.values(result)) expect(count).toBeGreaterThanOrEqual(1);

        const left = await db.select({ subject: notifications.subject }).from(notifications)
            .where(inArray(notifications.notificationId, old.map((n) => n.notificationId)));
        expect(left.map((n) => n.subject).sort()).toEqual(['read89', 'unread']);
        const messages = await db.select({ name: contactMessages.name }).from(contactMessages)
            .where(like(contactMessages.name, `${PREFIX}%`));
        expect(messages.map((m) => m.name)).toEqual([`${PREFIX}11months`]);
        const sessionIds = await db.select({ id: sessions.sessionId }).from(sessions).where(eq(sessions.userId, ids.admin));
        expect(sessionIds.map((s) => s.id)).toEqual([`${PREFIX}valid`]);
        const tokens = await db.select({ id: authTokens.tokenHash }).from(authTokens).where(eq(authTokens.userId, ids.admin));
        expect(tokens.map((t) => t.id)).toEqual([`${PREFIX}valid`]);
    });
});

describe('the scheduler', () => {
    it('keeps a failing job from throwing', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = await runJob({ name: 'broken', run: async () => { throw new Error('boom'); } });
        expect(result).toBeNull();
        expect(error).toHaveBeenCalled();
        error.mockRestore();
    });

    it('passes a job the time it runs', async () => {
        const run = vi.fn(async () => ({ done: 0 }));
        const before = Date.now();
        await runJob({ name: 'clock', run });
        expect(run.mock.calls[0][0].getTime()).toBeGreaterThanOrEqual(before);
    });
});
