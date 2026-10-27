import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations } from '../src/db/schema/index.js';
import { dayRange, londonInstant, whenRange } from '../src/lib/londonTime.js';

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'events-test-';

// A fixed "now": Wednesday 22 October 2031, noon in London (BST). That weekend
// the clocks go back (Sunday 26th), the hardest case for the weekend window
const NOW = londonInstant(2031, 10, 22, 12);
const at = (day, hours, minutes = 0) => londonInstant(2031, 10, day, hours, minutes);

const ids = {};

// What the public sees of an event, kept as approved_snapshot: Drizzle keys, ISO dates
const snapshot = (fields) => JSON.parse(JSON.stringify(fields));

beforeAll(async () => {
    // Only Date is faked: the routes' "now" is NOW, network timers stay real
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const [alpha, charlie, archived] = await db
        .insert(categories)
        .values([
            { slug: `${PREFIX}alpha`, name: `${PREFIX}Alpha` },
            { slug: `${PREFIX}charlie`, name: `${PREFIX}Charlie` },
            { slug: `${PREFIX}bravo`, name: `${PREFIX}Bravo`, isActive: false },
        ])
        .returning();
    Object.assign(ids, { alpha: alpha.categoryId, charlie: charlie.categoryId, archived: archived.categoryId });

    const [quays, square, stadium] = await db
        .insert(locations)
        .values([
            { placeId: `${PREFIX}quays`, locationName: 'Quays Venue', address: '1 Quay Street, Salford', latitude: 53.47, longitude: -2.29, area: 'salford' },
            { placeId: `${PREFIX}square`, locationName: 'Square Hall', address: '2 Square Road, Manchester', latitude: 53.48, longitude: -2.24, area: 'city-centre' },
            { placeId: `${PREFIX}stadium`, locationName: 'Big Stadium', address: '3 Ground Lane, Manchester', latitude: 53.48, longitude: -2.2, area: null },
        ])
        .returning();

    const organiser = (name, extra = {}) => ({
        username: name,
        email: `${PREFIX}${name}@example.test`,
        password: 'not-used',
        role: 'organiser',
        ...extra,
    });
    const [active, suspended, lifted] = await db
        .insert(users)
        .values([
            organiser('active'),
            organiser('suspended', { accStatus: 'suspended' }),
            // Suspended until yesterday: not yet seen and lifted, but no longer hidden
            organiser('lifted', { accStatus: 'suspended', suspendedUntil: at(21, 12) }),
        ])
        .returning();

    const base = {
        organiserId: active.userId,
        eventDescription: 'A test event.',
        locationId: square.locationId,
        categoryId: alpha.categoryId,
        status: 'approved',
    };
    const rows = {
        tonight: { eventName: 'Tonight Gig', startDatetime: at(22, 19), locationId: quays.locationId },
        weekend: { eventName: 'Saturday Market', startDatetime: at(25, 10) },
        // Friday afternoon: this week, but the weekend starts at 5pm
        friday: { eventName: 'Friday Matinee', startDatetime: at(24, 16) },
        // The Sunday the clocks go back, late: still the weekend
        sundayLate: { eventName: 'Sunday Late Show', startDatetime: at(26, 23, 30), locationId: stadium.locationId },
        later: { eventName: 'Later Lecture', startDatetime: at(31, 18) },
        past: { eventName: 'Yesterday Fair', startDatetime: at(21, 10) },
        // Started yesterday, ends tomorrow: on until it ends
        running: { eventName: 'Running Exhibition', startDatetime: at(21, 10), endDatetime: at(23, 18) },
        cancelled: { eventName: 'Cancelled Concert', startDatetime: at(25, 20), status: 'cancelled' },
        pending: { eventName: 'Pending Party', startDatetime: at(25, 20), status: 'pending' },
        draft: { eventName: 'Draft Dance', startDatetime: at(25, 20), status: 'draft' },
        rejected: { eventName: 'Rejected Rave', startDatetime: at(25, 20), status: 'rejected' },
        // An edit of a live event waiting for review: the snapshot is what the public sees
        edited: {
            eventName: 'Renamed Edit',
            startDatetime: at(30, 20),
            status: 'pending',
            approvedSnapshot: snapshot({
                eventName: 'Approved Original',
                eventDescription: 'The approved text.',
                startDatetime: at(29, 19),
                endDatetime: null,
                locationId: quays.locationId,
                categoryId: alpha.categoryId,
                ticketUrl: null,
                imageUrl: '/images/events/approved.jpg',
            }),
        },
        suspended: { eventName: 'Suspended Social', startDatetime: at(25, 12), organiserId: suspended.userId },
        lifted: { eventName: 'Lifted Lunch', startDatetime: at(25, 13), organiserId: lifted.userId },
        percent: { eventName: 'Half Price 50% Night', startDatetime: at(27, 19), categoryId: charlie.categoryId },
        archived: { eventName: 'Archived Category Talk', startDatetime: at(27, 19), categoryId: archived.categoryId },
    };
    const inserted = await db
        .insert(events)
        .values(Object.values(rows).map((row) => ({ ...base, ...row })))
        .returning({ eventId: events.eventId });
    Object.keys(rows).forEach((key, index) => {
        ids[key] = inserted[index].eventId;
    });
});

afterAll(async () => {
    vi.useRealTimers();
    // Events first: they hold on to their organiser, location and category (RESTRICT)
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(locations).where(like(locations.placeId, `${PREFIX}%`));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
});

// Names in the order the API returns them, from this file's categories only
async function names(query = {}) {
    const res = await request(app)
        .get('/api/v1/events')
        .query({ category: `${PREFIX}alpha,${PREFIX}charlie,${PREFIX}bravo`, ...query });
    expect(res.status).toBe(200);
    return res.body.data.map((event) => event.name);
}

describe('GET /events', () => {
    it('lists upcoming live events soonest first, the approved version of an edit included', async () => {
        expect(await names()).toEqual([
            'Running Exhibition',
            'Tonight Gig',
            'Friday Matinee',
            'Saturday Market',
            'Lifted Lunch',
            'Sunday Late Show',
            'Half Price 50% Night',
            'Archived Category Talk',
            'Approved Original',
            'Later Lecture',
        ]);
    });

    it('shows an edit waiting for review as its approved version', async () => {
        const res = await request(app).get('/api/v1/events').query({ category: `${PREFIX}alpha`, q: 'Approved Original' });
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({
            eventId: ids.edited,
            name: 'Approved Original',
            description: 'The approved text.',
            startDatetime: at(29, 19).toISOString(),
            status: 'approved',
            imageUrl: '/images/events/approved.jpg',
            location: { name: 'Quays Venue', area: 'salford' },
        });
        // The new name isn't public until an admin approves it
        expect(await names({ q: 'Renamed' })).toEqual([]);
    });

    it('returns the agreed shape with pagination', async () => {
        const res = await request(app)
            .get('/api/v1/events')
            .query({ category: `${PREFIX}alpha`, limit: 3, page: 2 });
        expect(res.body.pagination).toEqual({ page: 2, limit: 3, total: 8, totalPages: 3 });
        expect(res.body.data.map((event) => event.name)).toEqual(['Saturday Market', 'Lifted Lunch', 'Sunday Late Show']);
        expect(res.body.data[0]).toEqual({
            eventId: ids.weekend,
            name: 'Saturday Market',
            description: 'A test event.',
            startDatetime: at(25, 10).toISOString(),
            endDatetime: null,
            ticketUrl: null,
            imageUrl: null,
            status: 'approved',
            category: { slug: `${PREFIX}alpha`, name: `${PREFIX}Alpha` },
            location: { name: 'Square Hall', address: '2 Square Road, Manchester', area: 'city-centre', latitude: 53.48, longitude: -2.24 },
            organiser: { userId: expect.any(Number), username: 'active' },
        });
    });

    it('answers an empty page past the end rather than an error', async () => {
        const res = await request(app).get('/api/v1/events').query({ category: `${PREFIX}alpha`, page: 9 });
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.pagination.total).toBe(8);
    });

    it('filters by when, in Manchester time', async () => {
        // Starting before midnight, so one that is already on counts too
        expect(await names({ when: 'tonight' })).toEqual(['Running Exhibition', 'Tonight Gig']);
        // Friday 5pm to the end of Sunday, across the clock change
        expect(await names({ when: 'weekend' })).toEqual(['Saturday Market', 'Lifted Lunch', 'Sunday Late Show']);
        // Today and the next 7 days: up to the end of Wednesday 29th
        expect(await names({ when: 'week' })).toEqual([
            'Running Exhibition',
            'Tonight Gig',
            'Friday Matinee',
            'Saturday Market',
            'Lifted Lunch',
            'Sunday Late Show',
            'Half Price 50% Night',
            'Archived Category Talk',
            'Approved Original',
        ]);
    });

    it('filters by one day, searching the approved version of an edit', async () => {
        expect(await names({ date: '2031-10-29' })).toEqual(['Approved Original']);
        expect(await names({ date: '2031-10-30' })).toEqual([]);
        expect(await names({ date: '2031-10-26' })).toEqual(['Sunday Late Show']);
    });

    it('filters by area and by several categories', async () => {
        expect(await names({ location: 'salford' })).toEqual(['Tonight Gig', 'Approved Original']);
        expect(await names({ category: `${PREFIX}charlie` })).toEqual(['Half Price 50% Night']);
        expect(await names({ category: `${PREFIX}charlie,${PREFIX}bravo` })).toEqual(['Half Price 50% Night', 'Archived Category Talk']);
    });

    it('searches the name, category and venue, and takes % and _ literally', async () => {
        expect(await names({ q: 'saturday' })).toEqual(['Saturday Market']);
        expect(await names({ q: 'big stadium' })).toEqual(['Sunday Late Show']);
        expect(await names({ q: `${PREFIX}charlie` })).toEqual(['Half Price 50% Night']);
        expect(await names({ q: '%' })).toEqual(['Half Price 50% Night']);
        expect(await names({ q: '_' })).toEqual([]);
    });

    it('hides a suspended organiser\'s events, but not once the suspension has run out', async () => {
        const listed = await names();
        expect(listed).not.toContain('Suspended Social');
        expect(listed).toContain('Lifted Lunch');
    });

    it('refuses filters it does not know, naming each one', async () => {
        const res = await request(app)
            .get('/api/v1/events')
            .query({ when: 'someday', date: '2031-13-01', location: 'leeds', limit: 13, page: 0 });
        expect(res.status).toBe(400);
        expect(res.body.error.details.map((detail) => detail.path).sort()).toEqual([
            'query.date',
            'query.limit',
            'query.location',
            'query.page',
            'query.when',
        ]);
    });
});

describe('GET /events/summary', () => {
    it('counts what the lists show, in all, per range and per area', async () => {
        const res = await request(app).get('/api/v1/events/summary');
        expect(res.status).toBe(200);
        const { total, when, areas } = res.body.data;

        // Other test files add events too, so compare against the lists, which
        // take the same rules, rather than fixed numbers
        const count = async (query) =>
            (await request(app).get('/api/v1/events').query({ limit: 1, ...query })).body.pagination.total;
        expect(total).toBe(await count({}));
        expect(when).toEqual({
            tonight: await count({ when: 'tonight' }),
            weekend: await count({ when: 'weekend' }),
            week: await count({ when: 'week' }),
        });
        expect(areas.salford).toBe(await count({ location: 'salford' }));
        expect(areas['city-centre']).toBe(await count({ location: 'city-centre' }));
        // At least this file's own: 2 tonight, 2 at Quays Venue in Salford
        expect(when.tonight).toBeGreaterThanOrEqual(2);
        expect(areas.salford).toBeGreaterThanOrEqual(2);
    });
});

describe('GET /events/:id', () => {
    const get = (key) => request(app).get(`/api/v1/events/${ids[key]}`);

    it('opens anything that has been public', async () => {
        for (const key of ['tonight', 'past', 'cancelled', 'suspended']) {
            const res = await get(key);
            expect(res.status, key).toBe(200);
            expect(res.body.data.eventId).toBe(ids[key]);
        }
        expect((await get('cancelled')).body.data.status).toBe('cancelled');
        // Past is derived from the dates, not stored
        expect((await get('past')).body.data.status).toBe('approved');
    });

    it('opens an edit waiting for review as its approved version', async () => {
        const { body } = await get('edited');
        expect(body.data).toMatchObject({ name: 'Approved Original', status: 'approved', startDatetime: at(29, 19).toISOString() });
    });

    it('reads anything never public as not found', async () => {
        for (const key of ['pending', 'draft', 'rejected']) {
            const res = await get(key);
            expect(res.status, key).toBe(404);
            expect(res.body.error.message).toBe('Event not found.');
        }
        expect((await request(app).get('/api/v1/events/999999999')).status).toBe(404);
        expect((await request(app).get('/api/v1/events/abc')).status).toBe(400);
    });
});

describe('GET /categories', () => {
    it('lists active categories A to Z with their upcoming live events', async () => {
        const res = await request(app).get('/api/v1/categories');
        expect(res.status).toBe(200);
        const ours = res.body.data.filter((category) => category.slug.startsWith(PREFIX));
        expect(ours).toEqual([
            { slug: `${PREFIX}alpha`, name: `${PREFIX}Alpha`, description: null, upcomingEvents: 8 },
            { slug: `${PREFIX}charlie`, name: `${PREFIX}Charlie`, description: null, upcomingEvents: 1 },
        ]);
        const sorted = [...res.body.data].sort((a, b) => a.name.localeCompare(b.name));
        expect(res.body.data.map((c) => c.name)).toEqual(sorted.map((c) => c.name));
    });
});

describe('London time', () => {
    it('opens the weekend at 5pm Friday and keeps the one in progress on a Saturday', () => {
        expect(whenRange('weekend', NOW)).toEqual([at(24, 17), londonInstant(2031, 10, 27)]);
        const saturday = at(25, 9);
        expect(whenRange('weekend', saturday)).toEqual([at(24, 17), londonInstant(2031, 10, 27)]);
        const sunday = at(26, 22);
        expect(whenRange('weekend', sunday)[0]).toEqual(at(24, 17));
    });

    it('gives the day the clocks go back 25 hours', () => {
        const [from, to] = dayRange('2031-10-26');
        expect(from.toISOString()).toBe('2031-10-25T23:00:00.000Z');
        expect(to.toISOString()).toBe('2031-10-27T00:00:00.000Z');
    });
});
