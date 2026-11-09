import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { and, eq, inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations, systemLogs, favourites, categoryFollows, notifications } from '../src/db/schema/index.js';
import { deleteImage } from '../src/lib/images.js';
import { snapshotOf } from '../src/lib/organiserEvents.js';
import { testAgent } from './helpers.js';

// Cloudinary is never called; deleteImage only records what it was asked to delete
vi.mock('../src/lib/images.js', () => ({ uploadImage: vi.fn(), deleteImage: vi.fn() }));

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'moderation-test-';
const PASSWORD = 'correct-horse-battery';
const PLACE = 'N999999000201';
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY);
const londonInput = (date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' })
        .format(date)
        .replace(' ', 'T');

const ids = {};
const agents = {};

beforeAll(async () => {
    const [category] = await db.insert(categories).values({ slug: `${PREFIX}music`, name: `${PREFIX}Music` }).returning();
    ids.category = category.categoryId;
    const [other] = await db.insert(categories).values({ slug: `${PREFIX}food`, name: `${PREFIX}Food` }).returning();
    ids.otherCategory = other.categoryId;
    const [venue] = await db
        .insert(locations)
        .values({ placeId: PLACE, locationName: `${PREFIX}Hall`, address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();
    ids.venue = venue.locationId;

    const password = await bcrypt.hash(PASSWORD, 4);
    const account = (name, role, extra = {}) => ({
        username: `${PREFIX}${name}`,
        email: `${PREFIX}${name}@example.test`,
        password,
        role,
        emailVerifiedAt: new Date(),
        ...extra,
    });
    const created = await db
        .insert(users)
        .values([
            account('admin', 'admin'),
            account('organiser', 'organiser'),
            account('follower', 'user'),
            account('saver', 'user'),
            account('suspended', 'user', { accStatus: 'suspended' }),
        ])
        .returning();
    for (const user of created) ids[user.username.slice(PREFIX.length)] = user.userId;

    // follower and the suspended account follow the category; the organiser is
    // given a follow too, though the API never lets one follow, to show only
    // users hear
    await db.insert(categoryFollows).values([
        { userId: ids.follower, categoryId: ids.category },
        { userId: ids.suspended, categoryId: ids.category },
        { userId: ids.organiser, categoryId: ids.category },
    ]);

    for (const name of ['admin', 'organiser', 'follower']) {
        const agent = testAgent();
        const res = await agent.post('/api/v1/auth/login').send({ email: `${PREFIX}${name}@example.test`, password: PASSWORD });
        expect(res.status, name).toBe(200);
        agents[name] = agent;
    }
});

afterAll(async () => {
    // Notifications go with their events and their recipients (CASCADE)
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(systemLogs).where(inArray(systemLogs.userId, testUsers));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(locations).where(eq(locations.placeId, PLACE));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
});

beforeEach(() => {
    vi.mocked(deleteImage).mockReset();
});

async function insertEvent(changes = {}) {
    const [row] = await db
        .insert(events)
        .values({
            organiserId: ids.organiser,
            eventName: `${PREFIX}Gig`,
            eventDescription: 'A test event.',
            startDatetime: inDays(10),
            locationId: ids.venue,
            categoryId: ids.category,
            ticketUrl: 'https://example.test/tickets',
            status: 'pending',
            ...changes,
        })
        .returning();
    return row;
}

// A live event with an edit waiting: the snapshot is the approved version
async function insertPendingEdit(live = {}, edit = {}) {
    const row = await insertEvent({ status: 'approved', eventName: `${PREFIX}Approved`, ...live });
    const [saved] = await db
        .update(events)
        .set({ status: 'pending', approvedSnapshot: snapshotOf(row), eventName: `${PREFIX}Edited`, ...edit })
        .where(eq(events.eventId, row.eventId))
        .returning();
    return saved;
}

const readRow = async (eventId) => (await db.select().from(events).where(eq(events.eventId, eventId)))[0];
// What each test account was sent about this event
async function sentAbout(eventId) {
    const rows = await db
        .select({ userId: notifications.userId, type: notifications.type, subject: notifications.subject, body: notifications.body })
        .from(notifications)
        .where(eq(notifications.eventId, eventId));
    const byName = Object.fromEntries(Object.entries(ids).map(([name, id]) => [id, name]));
    return rows.filter((row) => byName[row.userId]).map((row) => ({ ...row, to: byName[row.userId] }));
}
// What deleteImage was asked to delete (map() also passes the index)
const deleted = () => vi.mocked(deleteImage).mock.calls.map(([publicId]) => publicId).filter(Boolean);
const recipients = (sent, type) => sent.filter((row) => row.type === type).map((row) => row.to).sort();
const save = (userId, eventId) => db.insert(favourites).values({ userId, eventId });
const approve = (eventId, agent = agents.admin) => agent.put(`/api/v1/events/${eventId}/approve`);
const reject = (eventId, reason, agent = agents.admin) => agent.put(`/api/v1/events/${eventId}/reject`).send({ reason });
const takeDown = (eventId, reason) => agents.admin.put(`/api/v1/events/${eventId}/take-down`).send({ reason });

describe('the admin\'s list', () => {
    it('is for admins only', async () => {
        expect((await request(app).get('/api/v1/events/manage')).status).toBe(401);
        expect((await agents.follower.get('/api/v1/events/manage')).status).toBe(403);
        expect((await agents.organiser.get('/api/v1/events/manage')).status).toBe(403);
    });

    it('shows every event but drafts, with the organiser and the approved version of an edit', async () => {
        const draft = await insertEvent({ status: 'draft' });
        const edit = await insertPendingEdit();

        const res = await agents.admin.get('/api/v1/events/manage');

        expect(res.status).toBe(200);
        const listed = res.body.data.map((event) => event.eventId);
        expect(listed).not.toContain(draft.eventId);
        const shown = res.body.data.find((event) => event.eventId === edit.eventId);
        expect(shown).toMatchObject({
            name: `${PREFIX}Edited`,
            status: 'pending',
            organiser: { userId: ids.organiser, username: `${PREFIX}organiser` },
            approvedSnapshot: {
                name: `${PREFIX}Approved`,
                category: { slug: `${PREFIX}music`, name: `${PREFIX}Music` },
                location: { placeId: PLACE, name: `${PREFIX}Hall` },
            },
        });
    });
});

describe('approving', () => {
    it('is for active admins only, and a draft is not found', async () => {
        const event = await insertEvent();
        expect((await approve(event.eventId, agents.organiser)).status).toBe(403);
        expect((await approve(event.eventId, agents.follower)).status).toBe(403);
        const draft = await insertEvent({ status: 'draft' });
        expect((await approve(draft.eventId)).status).toBe(404);
        expect((await readRow(event.eventId)).status).toBe('pending');
    });

    it('publishes a new event, records who decided, and tells the organiser and the category\'s active users', async () => {
        const event = await insertEvent({ rejectionReason: 'From an earlier round' });

        const res = await approve(event.eventId);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ eventId: event.eventId, status: 'approved', adminId: ids.admin, adminName: `${PREFIX}admin`, approvedSnapshot: null });
        const row = await readRow(event.eventId);
        expect(row).toMatchObject({ status: 'approved', rejectionReason: null, adminUpdatedBy: ids.admin });
        expect(row.adminUpdatedAt).not.toBeNull();

        const sent = await sentAbout(event.eventId);
        expect(recipients(sent, 'event_status')).toEqual(['organiser']);
        expect(sent.find((row) => row.type === 'event_status').subject).toBe(`Approved: ${PREFIX}Gig`);
        // Not the suspended follower, and not the organiser's follow
        expect(recipients(sent, 'category_new_event')).toEqual(['follower']);
        expect(sent.find((row) => row.type === 'category_new_event').body).toContain(`added to ${PREFIX}Music,`);
        expect(recipients(sent, 'event_update')).toEqual([]);

        const logs = await db
            .select()
            .from(systemLogs)
            .where(and(eq(systemLogs.userId, ids.admin), eq(systemLogs.action, 'Event Status Changed')));
        expect(logs.map((log) => log.details)).toContainEqual({ eventId: event.eventId, name: `${PREFIX}Gig`, status: 'approved' });
    });

    it('tells nobody following another category', async () => {
        const event = await insertEvent({ categoryId: ids.otherCategory });
        expect((await approve(event.eventId)).status).toBe(200);
        expect(recipients(await sentAbout(event.eventId), 'category_new_event')).toEqual([]);
    });

    // A follower who didn't save it is never told of the cancellation, so the
    // inbox says whether Explore still shows it (User Home's count)
    it('lets the follower\'s inbox tell whether the event is still listed', async () => {
        const event = await insertEvent();
        expect((await approve(event.eventId)).status).toBe(200);
        const announced = async () =>
            (await agents.follower.get('/api/v1/users/me/notifications')).body.data.find(
                (row) => row.eventId === event.eventId && row.type === 'category_new_event',
            );

        expect((await announced()).listed).toBe(true);
        expect((await takeDown(event.eventId, 'Not a real event')).status).toBe(200);
        expect((await announced()).listed).toBe(false);
    });

    it('replaces the live version with an edit, deletes the old photo, and tells the people who saved it', async () => {
        const event = await insertPendingEdit({ imagePublicId: `${PREFIX}old` }, { imagePublicId: `${PREFIX}new` });
        await save(ids.saver, event.eventId);

        const res = await approve(event.eventId);

        expect(res.status).toBe(200);
        expect(await readRow(event.eventId)).toMatchObject({ status: 'approved', approvedSnapshot: null, eventName: `${PREFIX}Edited`, imagePublicId: `${PREFIX}new` });
        expect(deleted()).toEqual([`${PREFIX}old`]);

        const sent = await sentAbout(event.eventId);
        expect(recipients(sent, 'event_update')).toEqual(['saver']);
        expect(recipients(sent, 'category_new_event')).toEqual([]);
        expect(sent.find((row) => row.type === 'event_status').body).toContain('Your changes');
    });

    it('keeps a photo the edit still shows', async () => {
        const event = await insertPendingEdit({ imagePublicId: `${PREFIX}kept` });
        expect((await approve(event.eventId)).status).toBe(200);
        expect(deleted()).toEqual([]);
    });

    it('decides only an event waiting for review', async () => {
        const live = await insertEvent({ status: 'approved' });
        const res = await approve(live.eventId);
        expect(res.status).toBe(400);
        expect(await sentAbout(live.eventId)).toEqual([]);
    });

    it('refuses a new event whose start has passed, but decides an edit of a live event still running', async () => {
        const expired = await insertEvent({ startDatetime: inDays(-1) });
        expect((await approve(expired.eventId)).status).toBe(400);
        expect((await reject(expired.eventId, 'Too late')).status).toBe(400);

        const running = await insertPendingEdit({ startDatetime: inDays(-1), endDatetime: inDays(1) });
        expect((await approve(running.eventId)).status).toBe(200);

        const ended = await insertPendingEdit({ startDatetime: inDays(-2), endDatetime: inDays(-1) });
        expect((await approve(ended.eventId)).status).toBe(400);
    });

    it('lets only one of two admins deciding at once through', async () => {
        const event = await insertEvent();

        const answers = await Promise.all([approve(event.eventId), reject(event.eventId, 'Second admin')]);

        const statuses = answers.map((res) => res.status).sort();
        expect(statuses[0]).toBe(200);
        expect([400, 409]).toContain(statuses[1]);
        expect(recipients(await sentAbout(event.eventId), 'event_status')).toEqual(['organiser']);
    });
});

describe('rejecting', () => {
    it('needs a reason, under its field', async () => {
        const event = await insertEvent();
        for (const reason of [undefined, '   ', 'x'.repeat(1001)]) {
            const res = await reject(event.eventId, reason);
            expect(res.status).toBe(400);
            expect(res.body.error.details[0].path).toBe('body.reason');
        }
        expect((await readRow(event.eventId)).status).toBe('pending');
    });

    it('stores the reason and tells the organiser, and only the organiser', async () => {
        const event = await insertEvent();
        await save(ids.saver, event.eventId);

        const res = await reject(event.eventId, '  The ticket link is broken.  ');

        expect(res.status).toBe(200);
        expect(await readRow(event.eventId)).toMatchObject({ status: 'rejected', rejectionReason: 'The ticket link is broken.', adminUpdatedBy: ids.admin });
        const sent = await sentAbout(event.eventId);
        expect(sent.map((row) => row.to)).toEqual(['organiser']);
        expect(sent[0]).toMatchObject({ type: 'event_status', subject: `Not approved: ${PREFIX}Gig` });
        expect(sent[0].body).toContain('The ticket link is broken.');
    });

    it('keeps the live version of a rejected edit public', async () => {
        const event = await insertPendingEdit({ imagePublicId: `${PREFIX}live` }, { imagePublicId: `${PREFIX}edit` });

        expect((await reject(event.eventId, 'Keep the old photo.')).status).toBe(200);

        const row = await readRow(event.eventId);
        expect(row.status).toBe('rejected');
        expect(row.approvedSnapshot.eventName).toBe(`${PREFIX}Approved`);
        expect(deleted()).toEqual([]);
        const pub = await request(app).get(`/api/v1/events/${event.eventId}`);
        expect(pub.body.data.name).toBe(`${PREFIX}Approved`);
    });
});

describe('taking a live event down', () => {
    it('cancels it with the reason, keeps its saves and tells the organiser and the people who saved it', async () => {
        const event = await insertEvent({ status: 'approved' });
        await save(ids.saver, event.eventId);

        const res = await takeDown(event.eventId, 'Not a real event.');

        expect(res.status).toBe(200);
        expect(await readRow(event.eventId)).toMatchObject({ status: 'cancelled', rejectionReason: 'Not a real event.', adminUpdatedBy: ids.admin });
        expect(await db.select().from(favourites).where(eq(favourites.eventId, event.eventId))).toHaveLength(1);
        const sent = await sentAbout(event.eventId);
        expect(recipients(sent, 'event_status')).toEqual(['organiser']);
        expect(sent.find((row) => row.type === 'event_status').body).toContain('Not a real event.');
        expect(recipients(sent, 'event_cancelled')).toEqual(['saver']);
        // Cancelled once public, so it can never be deleted
        expect((await agents.organiser.delete(`/api/v1/events/${event.eventId}`)).status).toBe(409);
    });

    it('needs a reason and takes down only a live event that hasn\'t ended', async () => {
        const live = await insertEvent({ status: 'approved' });
        expect((await takeDown(live.eventId, '')).status).toBe(400);

        const pending = await insertEvent();
        expect((await takeDown(pending.eventId, 'No')).status).toBe(400);
        const ended = await insertEvent({ status: 'approved', startDatetime: inDays(-2) });
        expect((await takeDown(ended.eventId, 'No')).status).toBe(400);
        expect((await agents.organiser.put(`/api/v1/events/${live.eventId}/take-down`).send({ reason: 'Mine' })).status).toBe(403);
    });
});

describe('what organisers\' changes send', () => {
    const form = (changes = {}) => ({
        eventName: `${PREFIX}Form`,
        category: `${PREFIX}music`,
        description: 'A test event.',
        startDatetime: londonInput(inDays(10)),
        endDatetime: null,
        placeId: PLACE,
        ticketUrl: 'https://example.test/tickets',
        ...changes,
    });

    it('tells admins when an event starts waiting, not at each save while it waits', async () => {
        const created = await agents.organiser.post('/api/v1/events').send(form({ submit: true }));
        expect(created.status).toBe(201);
        const { eventId } = created.body.data;
        expect(recipients(await sentAbout(eventId), 'event_pending_review')).toEqual(['admin']);

        expect((await agents.organiser.put(`/api/v1/events/${eventId}`).send(form({ submit: true }))).status).toBe(200);
        expect(recipients(await sentAbout(eventId), 'event_pending_review')).toEqual(['admin']);
    });

    it('says which kind of review it is', async () => {
        const draft = await agents.organiser.post('/api/v1/events').send(form());
        expect(recipients(await sentAbout(draft.body.data.eventId), 'event_pending_review')).toEqual([]);
        await agents.organiser.put(`/api/v1/events/${draft.body.data.eventId}/submit`);
        expect((await sentAbout(draft.body.data.eventId))[0].body).toContain('A new event');

        const live = await insertEvent({ status: 'approved' });
        await agents.organiser.put(`/api/v1/events/${live.eventId}`).send(form({ eventName: `${PREFIX}Live edit` }));
        expect((await sentAbout(live.eventId))[0].body).toContain('waiting for review. The approved version stays live');

        const rejected = await insertEvent({ status: 'rejected', rejectionReason: 'Fix it' });
        await agents.organiser.put(`/api/v1/events/${rejected.eventId}`).send(form({ submit: true }));
        expect((await sentAbout(rejected.eventId))[0].body).toContain('sent for review again');
    });

    it('tells the people who saved it and the admins when the organiser cancels, and clears an old rejection', async () => {
        const event = await insertPendingEdit();
        await db.update(events).set({ status: 'rejected', rejectionReason: 'The edit was wrong' }).where(eq(events.eventId, event.eventId));
        await save(ids.saver, event.eventId);

        expect((await agents.organiser.put(`/api/v1/events/${event.eventId}/cancel`)).status).toBe(200);

        expect((await readRow(event.eventId)).rejectionReason).toBeNull();
        const sent = await sentAbout(event.eventId);
        expect(recipients(sent, 'event_cancelled')).toEqual(['saver']);
        expect(sent.find((row) => row.type === 'event_cancelled').subject).toBe(`Cancelled: ${PREFIX}Approved`);
        expect(recipients(sent, 'event_cancelled_by_organiser')).toEqual(['admin']);
        expect(sent.filter((row) => row.to === 'organiser')).toEqual([]);
    });
});
