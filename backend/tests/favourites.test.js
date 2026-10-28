import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { and, eq, inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations, favourites, categoryFollows } from '../src/db/schema/index.js';

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'favourites-test-';
const PASSWORD = 'correct-horse-battery';
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY);

const ids = {};
const agents = {};

async function logIn(email) {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/auth/login').send({ email, password: PASSWORD });
    expect(res.status, email).toBe(200);
    return agent;
}

beforeAll(async () => {
    const [alpha, beta, archived] = await db
        .insert(categories)
        .values([
            { slug: `${PREFIX}alpha`, name: `${PREFIX}Alpha` },
            { slug: `${PREFIX}beta`, name: `${PREFIX}Beta` },
            { slug: `${PREFIX}archived`, name: `${PREFIX}Archived`, isActive: false },
        ])
        .returning();
    Object.assign(ids, { alpha: alpha.categoryId, beta: beta.categoryId, archived: archived.categoryId });

    const [venue] = await db
        .insert(locations)
        .values({ placeId: `${PREFIX}venue`, locationName: 'Test Hall', address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();

    const password = await bcrypt.hash(PASSWORD, 4);
    const account = (name, extra = {}) => ({
        username: name,
        email: `${PREFIX}${name}@example.test`,
        password,
        role: 'user',
        emailVerifiedAt: new Date(),
        ...extra,
    });
    const created = await db
        .insert(users)
        .values([
            account('user'),
            account('unverified', { emailVerifiedAt: null }),
            account('suspended', { accStatus: 'suspended' }),
            account('organiser', { role: 'organiser' }),
            account('suspended-organiser', { role: 'organiser', accStatus: 'suspended' }),
        ])
        .returning();
    const byName = Object.fromEntries(created.map((user) => [user.username, user.userId]));
    Object.assign(ids, { user: byName.user });

    const base = {
        organiserId: byName.organiser,
        eventDescription: 'A test event.',
        locationId: venue.locationId,
        categoryId: alpha.categoryId,
        status: 'approved',
        startDatetime: inDays(5),
    };
    const rows = {
        live: { eventName: 'Live Gig' },
        past: { eventName: 'Past Fair', startDatetime: inDays(-5) },
        cancelled: { eventName: 'Cancelled Concert', status: 'cancelled' },
        pending: { eventName: 'Pending Party', status: 'pending' },
        draft: { eventName: 'Draft Dance', status: 'draft' },
        // An edit waiting for review: still live as its approved version
        edited: {
            eventName: 'Renamed Edit',
            status: 'pending',
            approvedSnapshot: JSON.parse(JSON.stringify({
                eventName: 'Approved Original',
                eventDescription: 'The approved text.',
                startDatetime: inDays(6),
                endDatetime: null,
                locationId: venue.locationId,
                categoryId: alpha.categoryId,
                ticketUrl: null,
                imageUrl: null,
            })),
        },
        suspended: { eventName: 'Suspended Social', organiserId: byName['suspended-organiser'] },
    };
    const inserted = await db
        .insert(events)
        .values(Object.values(rows).map((row) => ({ ...base, ...row })))
        .returning({ eventId: events.eventId });
    Object.keys(rows).forEach((key, index) => {
        ids[key] = inserted[index].eventId;
    });

    for (const name of ['user', 'unverified', 'suspended', 'organiser']) {
        agents[name] = await logIn(`${PREFIX}${name}@example.test`);
    }
});

afterAll(async () => {
    // Favourites, follows and sessions go with the users (CASCADE); events first,
    // since they hold on to their organiser, location and category (RESTRICT)
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(locations).where(like(locations.placeId, `${PREFIX}%`));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
});

const save = (agent, key) => agent.put(`/api/v1/users/me/favourites/${ids[key]}`);
const unsave = (agent, key) => agent.delete(`/api/v1/users/me/favourites/${ids[key]}`);
const savedNames = async (agent) => (await agent.get('/api/v1/users/me/favourites')).body.data.map((event) => event.name);

describe('favourites', () => {
    it('needs a logged-in user', async () => {
        expect((await request(app).get('/api/v1/users/me/favourites')).status).toBe(401);
        expect((await request(app).put(`/api/v1/users/me/favourites/${ids.live}`)).status).toBe(401);
        // Organisers check events rather than attend them
        expect((await agents.organiser.get('/api/v1/users/me/favourites')).status).toBe(403);
        expect((await save(agents.organiser, 'live')).status).toBe(403);
    });

    it('saves a live event once, however often it is asked', async () => {
        expect((await save(agents.user, 'live')).status).toBe(204);
        expect((await save(agents.user, 'live')).status).toBe(204);
        const rows = await db
            .select()
            .from(favourites)
            .where(and(eq(favourites.userId, ids.user), eq(favourites.eventId, ids.live)));
        expect(rows).toHaveLength(1);

        const { body } = await agents.user.get('/api/v1/users/me/favourites');
        expect(body.data).toEqual([
            expect.objectContaining({ eventId: ids.live, name: 'Live Gig', listed: true, savedAt: expect.any(String) }),
        ]);
    });

    it('saves an edit waiting for review, shown as its approved version', async () => {
        expect((await save(agents.user, 'edited')).status).toBe(204);
        expect(await savedNames(agents.user)).toEqual(['Live Gig', 'Approved Original']);
    });

    it('refuses what the lists don\'t show, and anything never public', async () => {
        for (const key of ['past', 'cancelled', 'suspended']) {
            const res = await save(agents.user, key);
            expect(res.status, key).toBe(400);
        }
        for (const key of ['pending', 'draft']) {
            expect((await save(agents.user, key)).status, key).toBe(404);
        }
        expect((await agents.user.put('/api/v1/users/me/favourites/999999999')).status).toBe(404);
        expect((await agents.user.put('/api/v1/users/me/favourites/abc')).status).toBe(400);
    });

    it('keeps saves whose event has since ended or been cancelled, and lets them go', async () => {
        await db.insert(favourites).values([
            { userId: ids.user, eventId: ids.past },
            { userId: ids.user, eventId: ids.cancelled },
        ]);
        const { body } = await agents.user.get('/api/v1/users/me/favourites');
        const byName = Object.fromEntries(body.data.map((event) => [event.name, event]));
        expect(byName['Past Fair']).toMatchObject({ listed: false, status: 'approved' });
        expect(byName['Cancelled Concert']).toMatchObject({ listed: false, status: 'cancelled' });

        expect((await unsave(agents.user, 'past')).status).toBe(204);
        expect((await unsave(agents.user, 'cancelled')).status).toBe(204);
        expect(await savedNames(agents.user)).toEqual(['Live Gig', 'Approved Original']);
        // Removing what isn't saved is no error
        expect((await unsave(agents.user, 'cancelled')).status).toBe(204);
    });

    it('lets an unverified account save', async () => {
        expect((await save(agents.unverified, 'live')).status).toBe(204);
        expect(await savedNames(agents.unverified)).toEqual(['Live Gig']);
    });

    it('removes only your own save', async () => {
        // Both have saved Live Gig by now; one removing it leaves the other's
        expect((await unsave(agents.unverified, 'live')).status).toBe(204);
        expect(await savedNames(agents.unverified)).toEqual([]);
        expect(await savedNames(agents.user)).toContain('Live Gig');
    });

    it('lets a suspended account read its saves but not change them', async () => {
        expect((await agents.suspended.get('/api/v1/users/me/favourites')).status).toBe(200);
        expect((await save(agents.suspended, 'live')).status).toBe(403);
        expect((await unsave(agents.suspended, 'live')).status).toBe(403);
    });

    it('tells Event details whether Save can be offered, without saying why', async () => {
        const live = await request(app).get(`/api/v1/events/${ids.live}`);
        const suspended = await request(app).get(`/api/v1/events/${ids.suspended}`);
        expect(live.body.data.listed).toBe(true);
        expect(suspended.body.data.listed).toBe(false);
        expect(suspended.body.data.organiser).toEqual({ userId: expect.any(Number), username: 'suspended-organiser' });
    });
});

describe('category follows', () => {
    const follows = async (agent) => (await agent.get('/api/v1/users/me/follows')).body.data;
    const setFollows = (agent, slugs) => agent.put('/api/v1/users/me/follows').send({ categories: slugs });

    it('replaces the picks as a whole', async () => {
        expect(await follows(agents.user)).toEqual([]);

        const res = await setFollows(agents.user, [`${PREFIX}beta`, `${PREFIX}alpha`, `${PREFIX}alpha`]);
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([`${PREFIX}alpha`, `${PREFIX}beta`]);
        expect(await follows(agents.user)).toEqual([`${PREFIX}alpha`, `${PREFIX}beta`]);

        await setFollows(agents.user, [`${PREFIX}beta`]);
        expect(await follows(agents.user)).toEqual([`${PREFIX}beta`]);
        await setFollows(agents.user, []);
        expect(await follows(agents.user)).toEqual([]);
    });

    it('keeps the follow of an archived category, which Preferences doesn\'t show', async () => {
        await db.insert(categoryFollows).values({ userId: ids.user, categoryId: ids.archived });
        await setFollows(agents.user, [`${PREFIX}alpha`]);

        expect(await follows(agents.user)).toEqual([`${PREFIX}alpha`]);
        const kept = await db
            .select()
            .from(categoryFollows)
            .where(and(eq(categoryFollows.userId, ids.user), eq(categoryFollows.categoryId, ids.archived)));
        expect(kept).toHaveLength(1);
    });

    it('refuses a category that doesn\'t exist or is archived', async () => {
        for (const slug of [`${PREFIX}missing`, `${PREFIX}archived`, 'Not A Slug']) {
            const res = await setFollows(agents.user, [`${PREFIX}alpha`, slug]);
            expect(res.status, slug).toBe(400);
            expect(res.body.error.details[0].path).toMatch(/^body\.categories/);
        }
        expect((await agents.user.put('/api/v1/users/me/follows').send({})).status).toBe(400);
        // Nothing changed by the refused requests
        expect(await follows(agents.user)).toEqual([`${PREFIX}alpha`]);
    });

    it('is the user role\'s, and read-only while suspended', async () => {
        expect((await agents.organiser.get('/api/v1/users/me/follows')).status).toBe(403);
        expect((await agents.suspended.get('/api/v1/users/me/follows')).status).toBe(200);
        expect((await setFollows(agents.suspended, [`${PREFIX}alpha`])).status).toBe(403);
    });
});
