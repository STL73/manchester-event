import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { and, eq, inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations, systemLogs } from '../src/db/schema/index.js';
import { lookupPlace, searchPlaces } from '../src/lib/osm.js';

// The tests never reach OpenStreetMap: lookups and searches answer from here
vi.mock('../src/lib/osm.js', async (importOriginal) => ({
    ...(await importOriginal()),
    lookupPlace: vi.fn(),
    searchPlaces: vi.fn(),
}));

// Every row made here starts with this, so afterAll can remove them all.
// OSM ids can't carry it, so the test venues use ids no real place has
const PREFIX = 'organiser-events-test-';
const PASSWORD = 'correct-horse-battery';
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY);
// What the form's datetime-local input sends, as a London clock shows it
const londonInput = (date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' })
        .format(date)
        .replace(' ', 'T');

const KNOWN_PLACE = 'N999999000001';
const NEW_PLACE = 'W999999000002';
const FAR_PLACE = 'R999999000003';

const ids = {};
const agents = {};

async function logIn(email) {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/auth/login').send({ email, password: PASSWORD });
    expect(res.status, email).toBe(200);
    return agent;
}

beforeAll(async () => {
    const [active, archived] = await db
        .insert(categories)
        .values([
            { slug: `${PREFIX}music`, name: `${PREFIX}Music` },
            { slug: `${PREFIX}archived`, name: `${PREFIX}Archived`, isActive: false },
        ])
        .returning();
    Object.assign(ids, { category: active.categoryId, archivedCategory: archived.categoryId });

    const [venue] = await db
        .insert(locations)
        .values({ placeId: KNOWN_PLACE, locationName: `${PREFIX}Hall`, address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();
    ids.venue = venue.locationId;

    const password = await bcrypt.hash(PASSWORD, 4);
    const account = (name, extra = {}) => ({
        username: `${PREFIX}${name}`,
        email: `${PREFIX}${name}@example.test`,
        password,
        role: 'organiser',
        emailVerifiedAt: new Date(),
        ...extra,
    });
    const created = await db
        .insert(users)
        .values([
            account('organiser'),
            account('other'),
            account('unverified', { emailVerifiedAt: null }),
            account('suspended', { accStatus: 'suspended' }),
            account('user', { role: 'user' }),
        ])
        .returning();
    for (const user of created) ids[user.username.slice(PREFIX.length)] = user.userId;

    for (const name of ['organiser', 'other', 'unverified', 'suspended', 'user']) {
        agents[name] = await logIn(`${PREFIX}${name}@example.test`);
    }
});

afterAll(async () => {
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(systemLogs).where(inArray(systemLogs.userId, testUsers));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(locations).where(inArray(locations.placeId, [KNOWN_PLACE, NEW_PLACE, FAR_PLACE]));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
});

beforeEach(() => {
    lookupPlace.mockReset();
    searchPlaces.mockReset();
});

// A complete form, as Create Event sends it
const form = (changes = {}) => ({
    eventName: `${PREFIX}Gig`,
    category: `${PREFIX}music`,
    description: 'A test event.',
    startDatetime: londonInput(inDays(10)),
    endDatetime: null,
    placeId: KNOWN_PLACE,
    ticketUrl: 'https://example.test/tickets',
    ...changes,
});

// An event straight into the database, in any state the tests need
async function insertEvent(changes = {}) {
    const [row] = await db
        .insert(events)
        .values({
            organiserId: ids.organiser,
            eventName: `${PREFIX}Row`,
            eventDescription: 'A test event.',
            startDatetime: inDays(10),
            locationId: ids.venue,
            categoryId: ids.category,
            ticketUrl: 'https://example.test/tickets',
            status: 'draft',
            ...changes,
        })
        .returning();
    return row;
}

const readRow = async (eventId) => (await db.select().from(events).where(eq(events.eventId, eventId)))[0];
const logsFor = (userId, action) =>
    db.select().from(systemLogs).where(and(eq(systemLogs.userId, userId), eq(systemLogs.action, action)));

describe('who may use the organiser routes', () => {
    it('needs a logged-in, active organiser to write', async () => {
        expect((await request(app).post('/api/v1/events').send(form())).status).toBe(401);
        expect((await agents.user.post('/api/v1/events').send(form())).status).toBe(403);
        expect((await agents.suspended.post('/api/v1/events').send(form())).status).toBe(403);
    });

    it('lists only the organiser\'s own events, every status, and lets a suspended one read', async () => {
        const decidedAt = new Date('2026-10-20T09:15:00Z');
        const mine = await insertEvent({
            eventName: `${PREFIX}Mine`,
            status: 'rejected',
            rejectionReason: 'Too vague.',
            adminUpdatedAt: decidedAt,
        });
        const theirs = await insertEvent({ eventName: `${PREFIX}Theirs`, organiserId: ids.other });

        const { status, body } = await agents.organiser.get('/api/v1/users/me/events');
        expect(status).toBe(200);
        const found = body.data.find((event) => event.eventId === mine.eventId);
        expect(found).toMatchObject({
            status: 'rejected',
            rejectionReason: 'Too vague.',
            // When it was decided: Event Analytics' review times and rejections read it
            adminUpdatedAt: decidedAt.toISOString(),
            hasBeenPublic: false,
            editPending: false,
            category: { slug: `${PREFIX}music` },
            location: { placeId: KNOWN_PLACE, area: 'city-centre' },
        });
        expect(body.data.some((event) => event.eventId === theirs.eventId)).toBe(false);

        expect((await agents.suspended.get('/api/v1/users/me/events')).status).toBe(200);
        expect((await agents.user.get('/api/v1/users/me/events')).status).toBe(403);
    });

    it('treats someone else\'s event as not found', async () => {
        const theirs = await insertEvent({ organiserId: ids.other });
        expect((await agents.organiser.put(`/api/v1/events/${theirs.eventId}`).send(form())).status).toBe(404);
        expect((await agents.organiser.put(`/api/v1/events/${theirs.eventId}/submit`)).status).toBe(404);
        expect((await agents.organiser.delete(`/api/v1/events/${theirs.eventId}`)).status).toBe(404);
        expect(await readRow(theirs.eventId)).toBeDefined();
    });
});

describe('creating an event', () => {
    it('saves a draft, or a pending event when submitted, and logs it', async () => {
        const draft = await agents.organiser.post('/api/v1/events').send(form({ eventName: `${PREFIX}Draft` }));
        expect(draft.status).toBe(201);
        expect(draft.body.data).toMatchObject({ name: `${PREFIX}Draft`, status: 'draft' });
        expect((await readRow(draft.body.data.eventId)).organiserUpdatedAt).toBeNull();

        const sent = await agents.organiser.post('/api/v1/events').send(form({ eventName: `${PREFIX}Sent`, submit: true }));
        expect(sent.status).toBe(201);
        expect(sent.body.data.status).toBe('pending');
        expect((await readRow(sent.body.data.eventId)).organiserUpdatedAt).not.toBeNull();

        const logs = await logsFor(ids.organiser, 'Event Created');
        expect(logs.map((log) => log.details)).toEqual(expect.arrayContaining([
            { eventId: draft.body.data.eventId, name: `${PREFIX}Draft`, status: 'draft' },
            { eventId: sent.body.data.eventId, name: `${PREFIX}Sent`, status: 'pending' },
        ]));
    });

    it('never takes a status from the request', async () => {
        const res = await agents.organiser.post('/api/v1/events').send({ ...form(), status: 'approved' });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('draft');
    });

    it('reads times as a Manchester clock shows them', async () => {
        // 19:30 in July is BST, so 18:30 UTC; in January it is GMT
        const summer = await agents.organiser.post('/api/v1/events').send(form({ startDatetime: '2031-07-01T19:30', endDatetime: '2031-07-01T23:00' }));
        expect(summer.body.data.startDatetime).toBe('2031-07-01T18:30:00.000Z');
        expect(summer.body.data.endDatetime).toBe('2031-07-01T22:00:00.000Z');
        const winter = await agents.organiser.post('/api/v1/events').send(form({ startDatetime: '2031-01-15T19:30' }));
        expect(winter.body.data.startDatetime).toBe('2031-01-15T19:30:00.000Z');
    });

    it('refuses bad input, each under its field', async () => {
        const res = await agents.organiser.post('/api/v1/events').send(form({
            eventName: ' ',
            startDatetime: '2031-02-30T19:30',
            placeId: 'albert hall',
            ticketUrl: 'javascript:alert(1)',
        }));
        expect(res.status).toBe(400);
        expect(res.body.error.details.map((detail) => detail.path).sort()).toEqual(
            ['body.eventName', 'body.placeId', 'body.startDatetime', 'body.ticketUrl'],
        );

        const backwards = await agents.organiser.post('/api/v1/events').send(form({
            startDatetime: '2031-07-01T19:30',
            endDatetime: '2031-07-01T18:00',
        }));
        expect(backwards.status).toBe(400);
        expect(backwards.body.error.details[0].path).toBe('body.endDatetime');
    });

    it('takes only active categories', async () => {
        for (const category of [`${PREFIX}archived`, `${PREFIX}missing`]) {
            const res = await agents.organiser.post('/api/v1/events').send(form({ category }));
            expect(res.status, category).toBe(400);
            expect(res.body.error.details[0].path).toBe('body.category');
        }
    });

    it('needs a verified email and a start to come only when submitting', async () => {
        const unverified = await agents.unverified.post('/api/v1/events').send(form({ submit: true }));
        expect(unverified.status).toBe(403);
        expect((await agents.unverified.post('/api/v1/events').send(form())).status).toBe(201);

        const past = form({ startDatetime: londonInput(inDays(-2)) });
        const sent = await agents.organiser.post('/api/v1/events').send({ ...past, submit: true });
        expect(sent.status).toBe(400);
        expect(sent.body.error.details[0].path).toBe('body.startDatetime');
        // A draft may keep a passed date
        expect((await agents.organiser.post('/api/v1/events').send(past)).status).toBe(201);
    });
});

describe('venues', () => {
    it('reuses a known venue without asking OpenStreetMap', async () => {
        const res = await agents.organiser.post('/api/v1/events').send(form());
        expect(res.status).toBe(201);
        expect(res.body.data.location.name).toBe(`${PREFIX}Hall`);
        expect(lookupPlace).not.toHaveBeenCalled();
    });

    it('adds a new venue from OpenStreetMap\'s details, not the request\'s', async () => {
        lookupPlace.mockResolvedValue({
            placeId: NEW_PLACE,
            locationName: `${PREFIX}New Venue`,
            address: '27 Peter Street, Manchester M2 5QR',
            latitude: 53.4783,
            longitude: -2.2479,
            area: 'city-centre',
        });
        const res = await agents.organiser.post('/api/v1/events').send({
            ...form({ placeId: NEW_PLACE }),
            // Ignored: only the id is read
            locationName: 'Made Up',
            latitude: 0,
        });
        expect(res.status).toBe(201);
        expect(lookupPlace).toHaveBeenCalledWith(NEW_PLACE);
        expect(res.body.data.location).toMatchObject({ placeId: NEW_PLACE, name: `${PREFIX}New Venue`, latitude: 53.4783 });

        // The second event there finds it in the database
        lookupPlace.mockClear();
        expect((await agents.other.post('/api/v1/events').send(form({ placeId: NEW_PLACE }))).status).toBe(201);
        expect(lookupPlace).not.toHaveBeenCalled();
    });

    it('refuses a place OpenStreetMap doesn\'t know or that is outside Greater Manchester', async () => {
        lookupPlace.mockResolvedValue(null);
        const res = await agents.organiser.post('/api/v1/events').send(form({ placeId: FAR_PLACE }));
        expect(res.status).toBe(400);
        expect(res.body.error.details[0].path).toBe('body.placeId');
    });

    it('searches for organisers only, from 3 letters', async () => {
        searchPlaces.mockResolvedValue([{ placeId: 'W30343319', name: 'Albert Hall', address: '27 Peter Street, Manchester M2 5QR', area: 'city-centre' }]);
        const res = await agents.organiser.get('/api/v1/locations/search').query({ q: 'albert' });
        expect(res.status).toBe(200);
        expect(res.body.data[0].name).toBe('Albert Hall');
        expect(searchPlaces).toHaveBeenCalledWith('albert');

        expect((await agents.organiser.get('/api/v1/locations/search').query({ q: 'al' })).status).toBe(400);
        expect((await agents.user.get('/api/v1/locations/search').query({ q: 'albert' })).status).toBe(403);
        expect((await request(app).get('/api/v1/locations/search').query({ q: 'albert' })).status).toBe(401);
    });
});

describe('editing an event', () => {
    it('keeps a draft a draft, or sends it when submitted', async () => {
        const draft = await insertEvent();
        const saved = await agents.organiser.put(`/api/v1/events/${draft.eventId}`).send(form({ eventName: `${PREFIX}Still Draft` }));
        expect(saved.status).toBe(200);
        expect(saved.body.data).toMatchObject({ name: `${PREFIX}Still Draft`, status: 'draft' });

        const sent = await agents.organiser.put(`/api/v1/events/${draft.eventId}`).send(form({ submit: true }));
        expect(sent.body.data.status).toBe('pending');
        expect((await logsFor(ids.organiser, 'Draft Submitted')).some((log) => log.details.eventId === draft.eventId)).toBe(true);
    });

    it('keeps a live event\'s approved version public until the edit is approved', async () => {
        const live = await insertEvent({ eventName: `${PREFIX}Approved Name`, status: 'approved' });

        const first = await agents.organiser.put(`/api/v1/events/${live.eventId}`).send(form({ eventName: `${PREFIX}Edited Name` }));
        expect(first.status).toBe(200);
        expect(first.body.data).toMatchObject({ name: `${PREFIX}Edited Name`, status: 'pending', hasBeenPublic: true, editPending: true });

        // A second edit before the review keeps the first approved copy
        await agents.organiser.put(`/api/v1/events/${live.eventId}`).send(form({ eventName: `${PREFIX}Edited Again` }));
        const row = await readRow(live.eventId);
        expect(row.approvedSnapshot.eventName).toBe(`${PREFIX}Approved Name`);

        const shown = await request(app).get(`/api/v1/events/${live.eventId}`);
        expect(shown.body.data).toMatchObject({ name: `${PREFIX}Approved Name`, status: 'approved' });
    });

    it('lets a live event that has started keep its start time', async () => {
        // Whole minutes, as the form sends them, so the start reads as unchanged
        const minute = (date) => new Date(Math.floor(date.getTime() / 60000) * 60000);
        const started = await insertEvent({ status: 'approved', startDatetime: minute(inDays(-1)), endDatetime: minute(inDays(1)) });
        const res = await agents.organiser.put(`/api/v1/events/${started.eventId}`).send(form({
            startDatetime: londonInput(started.startDatetime),
            endDatetime: londonInput(started.endDatetime),
            eventName: `${PREFIX}Late Fix`,
        }));
        expect(res.status).toBe(200);
    });

    it('refuses cancelled and ended events', async () => {
        const cancelled = await insertEvent({ status: 'cancelled' });
        const ended = await insertEvent({ status: 'approved', startDatetime: inDays(-3) });
        for (const event of [cancelled, ended]) {
            expect((await agents.organiser.put(`/api/v1/events/${event.eventId}`).send(form())).status).toBe(400);
        }
    });
});

describe('submitting a draft from My Drafts', () => {
    it('sends a draft whose start is to come', async () => {
        const draft = await insertEvent();
        const res = await agents.organiser.put(`/api/v1/events/${draft.eventId}/submit`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('pending');
    });

    it('refuses anything else, a passed start and an unverified email', async () => {
        const pending = await insertEvent({ status: 'pending' });
        expect((await agents.organiser.put(`/api/v1/events/${pending.eventId}/submit`)).status).toBe(400);

        const stale = await insertEvent({ startDatetime: inDays(-1) });
        expect((await agents.organiser.put(`/api/v1/events/${stale.eventId}/submit`)).status).toBe(400);
        expect((await readRow(stale.eventId)).status).toBe('draft');

        const theirs = await insertEvent({ organiserId: ids.unverified });
        expect((await agents.unverified.put(`/api/v1/events/${theirs.eventId}/submit`)).status).toBe(403);
    });
});

describe('cancelling an event', () => {
    it('cancels a live event', async () => {
        const live = await insertEvent({ status: 'approved' });
        const res = await agents.organiser.put(`/api/v1/events/${live.eventId}/cancel`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('cancelled');
        expect((await logsFor(ids.organiser, 'Event Cancelled')).some((log) => log.details.eventId === live.eventId)).toBe(true);
    });

    it('cancels the approved version and drops an edit still waiting', async () => {
        const approved = await insertEvent({ eventName: `${PREFIX}Before`, status: 'approved' });
        await agents.organiser.put(`/api/v1/events/${approved.eventId}`).send(form({ eventName: `${PREFIX}After` }));

        const res = await agents.organiser.put(`/api/v1/events/${approved.eventId}/cancel`);
        expect(res.status).toBe(200);
        const row = await readRow(approved.eventId);
        expect(row).toMatchObject({ eventName: `${PREFIX}Before`, status: 'cancelled', approvedSnapshot: null });
        expect(row.startDatetime.getTime()).toBe(approved.startDatetime.getTime());
    });

    it('refuses an event that was never public, or is already cancelled or over', async () => {
        const draft = await insertEvent();
        const cancelled = await insertEvent({ status: 'cancelled' });
        const ended = await insertEvent({ status: 'approved', startDatetime: inDays(-3) });
        for (const event of [draft, cancelled, ended]) {
            expect((await agents.organiser.put(`/api/v1/events/${event.eventId}/cancel`)).status).toBe(400);
        }
    });
});

describe('deleting an event', () => {
    it('deletes one that was never public', async () => {
        for (const status of ['draft', 'pending', 'rejected']) {
            const event = await insertEvent({ status });
            expect((await agents.organiser.delete(`/api/v1/events/${event.eventId}`)).status, status).toBe(204);
            expect(await readRow(event.eventId)).toBeUndefined();
        }
        expect((await logsFor(ids.organiser, 'Event Deleted')).length).toBeGreaterThanOrEqual(3);
    });

    it('keeps one that has been public: it can only be cancelled', async () => {
        const approved = await insertEvent({ status: 'approved' });
        const cancelled = await insertEvent({ status: 'cancelled' });
        const editWaiting = await insertEvent({
            status: 'pending',
            approvedSnapshot: { eventName: 'Approved', startDatetime: inDays(10).toISOString() },
        });
        for (const event of [approved, cancelled, editWaiting]) {
            expect((await agents.organiser.delete(`/api/v1/events/${event.eventId}`)).status).toBe(409);
            expect(await readRow(event.eventId)).toBeDefined();
        }
    });
});
