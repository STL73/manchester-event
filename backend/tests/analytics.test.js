import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { inArray, like, or } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations, favourites, categoryFollows, systemLogs } from '../src/db/schema/index.js';
import { LOG } from '../src/constants/logActions.js';
import { DAY, insertAccounts, logInAll } from './helpers.js';

// Every account, category and venue made here starts with PREFIX, so afterAll
// can remove them all. The log rows carry TOKEN instead: the test accounts'
// own sign-ins contain PREFIX, so searching TOKEN finds only the rows below,
// whatever other test files are logging at the same moment
const PREFIX = 'analytics-test-';
const TOKEN = 'qzlogtoken';
const MINUTE = 60 * 1000;

// [name, role, extra]; the log rows below copy each one's role
const ACCOUNTS = [
    ['admin', 'admin'],
    ['suspendedadmin', 'admin', { accStatus: 'suspended' }],
    ['user', 'user'],
    ['user2', 'user'],
    ['suspended', 'user', { accStatus: 'suspended', suspensionReason: 'Test' }],
    ['organiser', 'organiser'],
    ['other', 'organiser'],
];

const ids = {};
const agents = {};
const failedAt = {};

beforeAll(async () => {
    const created = await db
        .insert(categories)
        .values(['alpha', 'beta', 'gamma'].map((name) => ({ slug: `${PREFIX}${name}`, name: `${PREFIX}${name}` })))
        .returning();
    for (const category of created) ids[category.slug.slice(PREFIX.length)] = category.categoryId;

    const [venue] = await db
        .insert(locations)
        .values({ placeId: `${PREFIX}venue`, locationName: 'Test Hall', address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();

    Object.assign(ids, await insertAccounts(PREFIX, ACCOUNTS));

    const event = (organiser, category, name) => ({
        organiserId: ids[organiser],
        eventName: name,
        eventDescription: 'A test event.',
        startDatetime: new Date(Date.now() + 10 * DAY),
        locationId: venue.locationId,
        categoryId: ids[category],
        status: 'approved',
    });
    const [mine, second, theirs] = await db
        .insert(events)
        .values([
            event('organiser', 'alpha', `${TOKEN} Gig`),
            event('organiser', 'beta', `${PREFIX}Second`),
            event('other', 'gamma', `${PREFIX}Theirs`),
        ])
        .returning();
    Object.assign(ids, { mine: mine.eventId, second: second.eventId, theirs: theirs.eventId });

    await db.insert(favourites).values([
        { userId: ids.user, eventId: ids.mine },
        { userId: ids.user2, eventId: ids.mine },
        { userId: ids.user, eventId: ids.theirs },
    ]);
    await db.insert(categoryFollows).values([
        { userId: ids.user, categoryId: ids.alpha },
        { userId: ids.user, categoryId: ids.beta },
        { userId: ids.user, categoryId: ids.gamma },
        { userId: ids.user2, categoryId: ids.alpha },
        // Suspended: told about nothing, so reaches nobody
        { userId: ids.suspended, categoryId: ids.alpha },
    ]);

    Object.assign(agents, await logInAll(PREFIX, ['admin', 'suspendedadmin', 'user', 'organiser']));
    agents.guest = request(app);

    // System Logs: one row of each kind, a minute apart, newest first. The
    // copied usernames carry TOKEN; the accounts' names now are PREFIX's
    const now = Date.now();
    const as = (key, action, who, details, extra = {}) => ({
        action,
        userId: ids[who],
        username: `${TOKEN}-${key}`,
        role: ACCOUNTS.find(([name]) => name === who)[1],
        details,
        ...extra,
    });
    const rows = [
        as('a', LOG.EVENT_STATUS_CHANGED, 'admin', { eventId: ids.mine, name: 'Old name', status: 'approved' }),
        as('b', LOG.EVENT_CREATED, 'organiser', { eventId: 2147483000, name: 'Gone event', status: 'draft' }),
        as('c', LOG.USER_LOGIN, 'user', null),
        as('d', LOG.USER_LOGIN_FAILED, 'user', { reason: 'Incorrect password', ip: '192.0.2.1' }),
        as('e', LOG.USER_STATUS_CHANGED, 'admin', { userId: ids.user, username: 'old-name', status: 'suspended', reason: `${TOKEN} spam reason` }),
        as('f', LOG.PROFILE_UPDATED, 'user', { fields: ['username'] }, { username: `${TOKEN}100%` }),
        as('g', LOG.PROFILE_UPDATED, 'user', { fields: ['username'] }, { username: `${TOKEN}100x` }),
        // Found only through the event's name now
        as('h', LOG.EVENT_UPDATED, 'organiser', { eventId: ids.mine, name: 'Old name' }, { username: `${PREFIX}renamed` }),
        as('i', LOG.USER_LOGIN, 'admin', null),
    ].map((row, index) => ({ ...row, createdAt: new Date(now - (index + 1) * MINUTE) }));
    await db.insert(systemLogs).values(rows);

    // Failed sign-ins for Site Analytics: one in its 14 days, one long before
    failedAt.recent = new Date(now - 3 * DAY - 123);
    failedAt.old = new Date(now - 20 * DAY - 123);
    await db.insert(systemLogs).values([
        { action: LOG.USER_LOGIN_FAILED, userId: ids.user2, username: `${PREFIX}user2`, role: 'user', createdAt: failedAt.recent },
        { action: LOG.USER_LOGIN_FAILED, userId: ids.user2, username: `${PREFIX}user2`, role: 'user', createdAt: failedAt.old },
    ]);
});

afterAll(async () => {
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db
        .delete(systemLogs)
        .where(or(inArray(systemLogs.userId, testUsers), like(systemLogs.username, `${TOKEN}%`), like(systemLogs.username, `${PREFIX}%`)));
    // Favourites and follows go with their events and accounts
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
    await db.delete(locations).where(like(locations.placeId, `${PREFIX}%`));
});

const logs = (query = {}, agent = agents.admin) =>
    agent.get('/api/v1/logs').query({ q: TOKEN, ...query });
// Each row by the letter it was made with
const letters = {
    [`${TOKEN}-a`]: 'a', [`${TOKEN}-b`]: 'b', [`${TOKEN}-c`]: 'c', [`${TOKEN}-d`]: 'd',
    [`${TOKEN}-e`]: 'e', [`${TOKEN}100%`]: 'f', [`${TOKEN}100x`]: 'g', [`${PREFIX}renamed`]: 'h', [`${TOKEN}-i`]: 'i',
};
const keys = (res) => res.body.data.map((row) => letters[row.username] ?? row.username);

describe('GET /logs', () => {
    it('is for admins, suspended ones included, since it only reads', async () => {
        expect((await logs({}, agents.guest)).status).toBe(401);
        expect((await logs({}, agents.user)).status).toBe(403);
        expect((await logs({}, agents.organiser)).status).toBe(403);
        expect((await logs({}, agents.suspendedadmin)).status).toBe(200);
    });

    it('lists newest first, with what each pill would show for the same search', async () => {
        const res = await logs();
        expect(res.status).toBe(200);
        expect(keys(res)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
        expect(res.body.counts).toEqual({ all: 9, events: 3, accounts: 3, signins: 3, failed: 1, admin: 3, 'admin-actions': 2 });
        expect(res.body.pagination).toEqual({ page: 1, limit: 25, total: 9, totalPages: 1 });
    });

    it('shows one view, the same rows as the page describes it', async () => {
        expect(keys(await logs({ view: 'events' }))).toEqual(['a', 'b', 'h']);
        expect(keys(await logs({ view: 'signins' }))).toEqual(['c', 'd', 'i']);
        expect(keys(await logs({ view: 'failed' }))).toEqual(['d']);
        expect(keys(await logs({ view: 'admin' }))).toEqual(['a', 'e', 'i']);
        // Admin Home's Recent Admin Actions: what admins did, not their sign-ins
        expect(keys(await logs({ view: 'admin-actions' }))).toEqual(['a', 'e']);
        const accounts = await logs({ view: 'accounts' });
        expect(keys(accounts)).toEqual(['e', 'f', 'g']);
        expect(accounts.body.pagination.total).toBe(3);
    });

    it('pages through the view', async () => {
        const res = await logs({ limit: 3, page: 2 });
        expect(keys(res)).toEqual(['d', 'e', 'f']);
        expect(res.body.pagination).toEqual({ page: 2, limit: 3, total: 9, totalPages: 3 });
    });

    it('names the event and accounts as they are now, and nothing that has gone', async () => {
        const rows = (await logs()).body.data;
        const row = (username) => rows.find((entry) => entry.username === username);
        expect(row(`${TOKEN}-a`)).toMatchObject({ eventName: `${TOKEN} Gig`, actorName: `${PREFIX}admin`, targetName: null });
        expect(row(`${TOKEN}-b`)).toMatchObject({ eventName: null, details: { name: 'Gone event' } });
        expect(row(`${TOKEN}-e`)).toMatchObject({ targetName: `${PREFIX}user`, details: { username: 'old-name' } });
    });

    it('searches what the sentence shows, taking % and _ literally', async () => {
        expect(keys(await logs({ q: `${TOKEN}100%` }))).toEqual(['f']);
        expect((await logs({ q: `${TOKEN}100_` })).body.data).toEqual([]);
        // Through the reason in the details, and the event's current name
        expect(keys(await logs({ q: `${TOKEN} spam` }))).toEqual(['e']);
        expect(keys(await logs({ q: `${TOKEN} Gig`, view: 'events' }))).toEqual(['a', 'h']);
    });

    it('refuses a view or limit it doesn\'t know', async () => {
        expect((await logs({ view: 'everything' })).status).toBe(400);
        expect((await logs({ limit: 26 })).status).toBe(400);
        expect((await logs({ page: 0 })).status).toBe(400);
    });
});

describe('GET /analytics/site', () => {
    const site = (agent = agents.admin) => agent.get('/api/v1/analytics/site');

    it('is for admins', async () => {
        expect((await site(agents.guest)).status).toBe(401);
        expect((await site(agents.organiser)).status).toBe(403);
        expect((await site(agents.user)).status).toBe(403);
    });

    it('sends every save as which event and when, never who', async () => {
        const res = await site();
        expect(res.status).toBe(200);
        const ours = res.body.data.saves.filter((save) => [ids.mine, ids.theirs].includes(save.eventId));
        expect(ours).toHaveLength(3);
        for (const save of ours) expect(Object.keys(save).sort()).toEqual(['createdAt', 'eventId']);
    });

    it('counts followers who would be told: active user accounts', async () => {
        const follows = (await site()).body.data.follows.filter((row) => row.categoryId.startsWith(PREFIX));
        expect(follows).toEqual([
            { categoryId: `${PREFIX}alpha`, count: 2 },
            { categoryId: `${PREFIX}beta`, count: 1 },
            { categoryId: `${PREFIX}gamma`, count: 1 },
        ]);
    });

    it('sends the failed sign-ins of the last 15 days only', async () => {
        const times = (await site()).body.data.failedSignIns.map((row) => row.createdAt);
        expect(times).toContain(failedAt.recent.toISOString());
        expect(times).not.toContain(failedAt.old.toISOString());
    });
});

describe('GET /analytics/organiser', () => {
    const organiser = (agent = agents.organiser) => agent.get('/api/v1/analytics/organiser');

    it('is for organisers', async () => {
        expect((await organiser(agents.guest)).status).toBe(401);
        expect((await organiser(agents.admin)).status).toBe(403);
        expect((await organiser(agents.user)).status).toBe(403);
    });

    it('sends saves of their own events only, never who saved', async () => {
        const { saves } = (await organiser()).body.data;
        expect(saves).toHaveLength(2);
        for (const save of saves) {
            expect(save.eventId).toBe(ids.mine);
            expect(Object.keys(save).sort()).toEqual(['createdAt', 'eventId']);
        }
    });

    it('counts followers of the categories they post in, and each person once', async () => {
        const { follows, audience } = (await organiser()).body.data;
        expect(follows).toEqual([
            { categoryId: `${PREFIX}alpha`, count: 2 },
            { categoryId: `${PREFIX}beta`, count: 1 },
        ]);
        // user follows alpha and beta, user2 alpha; the suspended account isn't counted
        expect(audience).toBe(2);
    });
});
