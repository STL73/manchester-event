import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { and, eq, inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations, systemLogs, notifications } from '../src/db/schema/index.js';
import { deleteImage } from '../src/lib/images.js';
import { DAY, eventInserter, insertAccounts, logInAll } from './helpers.js';

// Cloudinary is never called; deleteImage only records what it was asked to delete
vi.mock('../src/lib/images.js', () => ({ uploadImage: vi.fn(), deleteImage: vi.fn() }));

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'manage-users-test-';
const PLACE = 'N999999000301';
const MINUTE = 60 * 1000;

const ids = {};
const agents = {};

beforeAll(async () => {
    const [category] = await db.insert(categories).values({ slug: `${PREFIX}music`, name: `${PREFIX}Music` }).returning();
    ids.category = category.categoryId;
    const [venue] = await db
        .insert(locations)
        .values({ placeId: PLACE, locationName: `${PREFIX}Hall`, address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();
    ids.venue = venue.locationId;

    Object.assign(ids, await insertAccounts(PREFIX, [
        ['admin', 'admin'],
        ['otheradmin', 'admin'],
        ['suspendedadmin', 'admin', { accStatus: 'suspended' }],
        ['user', 'user'],
        ['organiser', 'organiser'],
        ['spare', 'user'],
        ['draftsonly', 'organiser', { avatar: 'https://example.test/a.png', avatarPublicId: `${PREFIX}avatar` }],
    ]));

    // The organiser: one live event, one waiting, one draft (not counted)
    await insertEvent({ status: 'approved', eventName: `${PREFIX}Live gig` });
    await insertEvent({ status: 'pending' });
    await insertEvent({ status: 'draft' });
    // Never public, so their account can go, photo and all
    await insertEvent({ organiserId: ids.draftsonly, status: 'draft', imagePublicId: `${PREFIX}draft-photo` });
    await insertEvent({ organiserId: ids.draftsonly, status: 'rejected' });

    Object.assign(agents, await logInAll(PREFIX, ['admin', 'suspendedadmin', 'user', 'organiser', 'spare']));
});

afterAll(async () => {
    // Notifications and sessions go with their accounts (CASCADE)
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(systemLogs).where(inArray(systemLogs.userId, testUsers));
    // The admin's log rows about deleted accounts name them in details
    await db.delete(systemLogs).where(like(systemLogs.username, `${PREFIX}%`));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(locations).where(eq(locations.placeId, PLACE));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
});

beforeEach(() => {
    vi.mocked(deleteImage).mockReset();
});

const insertEvent = eventInserter(ids, { eventName: `${PREFIX}Gig`, status: 'pending' });

const setStatus = (userId, body, agent = agents.admin) => agent.put(`/api/v1/users/${userId}/status`).send(body);
const removeAccount = (userId, agent = agents.admin) => agent.delete(`/api/v1/users/${userId}`);
const readUser = async (userId) => (await db.select().from(users).where(eq(users.userId, userId)))[0];
const statusNotes = (userId) =>
    db
        .select({ subject: notifications.subject, body: notifications.body })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.type, 'account_status')))
        // Oldest first, so .at(-1) is the newest: without an order Postgres
        // may return them any way, and did when every test file ran at once
        .orderBy(notifications.notificationId);
const adminLogs = (action) =>
    db
        .select({ details: systemLogs.details })
        .from(systemLogs)
        .where(and(eq(systemLogs.userId, ids.admin), eq(systemLogs.action, action)));
// Back to active straight in the table, so each test starts from the same place
const reset = (userId) =>
    db.update(users).set({ accStatus: 'active', suspendedUntil: null, suspensionReason: null }).where(eq(users.userId, userId));

describe('the accounts list', () => {
    it('is for admins, suspended ones included, since it only reads', async () => {
        expect((await request(app).get('/api/v1/users')).status).toBe(401);
        expect((await agents.user.get('/api/v1/users')).status).toBe(403);
        expect((await agents.organiser.get('/api/v1/users')).status).toBe(403);
        expect((await agents.suspendedadmin.get('/api/v1/users')).status).toBe(200);
    });

    it('shows every account, newest first, with what an organiser has sent and never a password', async () => {
        const res = await agents.admin.get('/api/v1/users');

        expect(res.status).toBe(200);
        const mine = res.body.data.filter((user) => user.username.startsWith(PREFIX));
        expect(mine.map((user) => user.userId)).toEqual([...mine.map((user) => user.userId)].sort((a, b) => b - a));
        const organiser = mine.find((user) => user.userId === ids.organiser);
        // The draft stays with the organiser
        expect(organiser).toMatchObject({ role: 'organiser', eventCount: 2, hasBeenPublic: true, accStatus: 'active' });
        expect(mine.find((user) => user.userId === ids.draftsonly)).toMatchObject({ eventCount: 1, hasBeenPublic: false });
        expect(mine.find((user) => user.userId === ids.user)).toMatchObject({ eventCount: 0, hasBeenPublic: false });
        expect(organiser).not.toHaveProperty('password');
        expect(organiser).toHaveProperty('updatedAt');
    });
});

describe('suspending', () => {
    beforeEach(() => reset(ids.user));

    it('is for active admins only, and never an admin or yourself', async () => {
        const body = { status: 'suspended', reason: 'Spam', days: 7 };
        expect((await setStatus(ids.spare, body, agents.user)).status).toBe(403);
        expect((await setStatus(ids.spare, body, agents.organiser)).status).toBe(403);
        expect((await setStatus(ids.spare, body, agents.suspendedadmin)).status).toBe(403);
        expect((await setStatus(ids.otheradmin, body)).status).toBe(403);
        expect((await setStatus(ids.admin, body)).status).toBe(400);
        expect((await setStatus(999999999, body)).status).toBe(404);
        expect((await readUser(ids.spare)).accStatus).toBe('active');
        expect((await readUser(ids.otheradmin)).accStatus).toBe('active');
    });

    it('sets the end, the reason, a log row and the person\'s notification', async () => {
        const before = Date.now();
        const res = await setStatus(ids.user, { status: 'suspended', reason: 'Spam messages', days: 7 });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ userId: ids.user, accStatus: 'suspended', suspensionReason: 'Spam messages' });
        const until = (await readUser(ids.user)).suspendedUntil.getTime();
        expect(until).toBeGreaterThanOrEqual(before + 7 * DAY - MINUTE);
        expect(until).toBeLessThanOrEqual(Date.now() + 7 * DAY + MINUTE);

        const logs = await adminLogs('User Status Changed');
        expect(logs.map((log) => log.details)).toContainEqual({
            userId: ids.user,
            username: `${PREFIX}user`,
            status: 'suspended',
            reason: 'Spam messages',
            until: new Date(until).toISOString(),
        });
        const notes = await statusNotes(ids.user);
        expect(notes.at(-1).subject).toBe('Account Suspended');
        expect(notes.at(-1).body).toContain('Reason: Spam messages');
        expect(notes.at(-1).body).toMatch(/until \d{1,2} \w+ \d{4}/);
    });

    it('takes effect on the next request: reading works, changing doesn\'t', async () => {
        expect((await setStatus(ids.user, { status: 'suspended', reason: 'Spam', days: 30 })).status).toBe(200);
        const until = (await readUser(ids.user)).suspendedUntil.getTime();
        expect(Math.abs(until - (Date.now() + 30 * DAY))).toBeLessThan(MINUTE);

        const me = await agents.user.get('/api/v1/auth/me');
        expect(me.status).toBe(200);
        expect(me.body.data).toMatchObject({ accStatus: 'suspended', suspensionReason: 'Spam' });
        expect((await agents.user.put('/api/v1/users/me/follows').send({ categories: [] })).status).toBe(403);
    });

    it('can last until lifted, and Keep holds the end while the reason changes', async () => {
        expect((await setStatus(ids.user, { status: 'suspended', reason: 'First', days: null })).status).toBe(200);
        expect((await readUser(ids.user)).suspendedUntil).toBeNull();

        await setStatus(ids.user, { status: 'suspended', reason: 'First', days: 7 });
        const { suspendedUntil } = await readUser(ids.user);
        const kept = await setStatus(ids.user, { status: 'suspended', reason: 'Second' });

        expect(kept.status).toBe(200);
        const row = await readUser(ids.user);
        expect(row.suspendedUntil).toEqual(suspendedUntil);
        expect(row.suspensionReason).toBe('Second');
        // Each change of terms is told
        expect((await statusNotes(ids.user)).at(-1).body).toContain('Reason: Second');
    });

    it('needs a reason, and a length unless one is already set', async () => {
        const noReason = await setStatus(ids.user, { status: 'suspended', reason: '  ', days: 7 });
        expect(noReason.status).toBe(400);
        expect(noReason.body.error.details.map((detail) => detail.path)).toContain('body.reason');

        const keepWhileActive = await setStatus(ids.user, { status: 'suspended', reason: 'Spam' });
        expect(keepWhileActive.status).toBe(400);
        expect(keepWhileActive.body.error.details.map((detail) => detail.path)).toContain('body.days');

        const oddLength = await setStatus(ids.user, { status: 'suspended', reason: 'Spam', days: 3 });
        expect(oddLength.status).toBe(400);
        expect((await readUser(ids.user)).accStatus).toBe('active');
    });

    it('treats a suspension whose end has passed as over, so there is no end to keep', async () => {
        await db
            .update(users)
            .set({ accStatus: 'suspended', suspendedUntil: new Date(Date.now() - MINUTE), suspensionReason: 'Old' })
            .where(eq(users.userId, ids.user));

        const keep = await setStatus(ids.user, { status: 'suspended', reason: 'New' });
        expect(keep.status).toBe(400);
        expect(keep.body.error.details.map((detail) => detail.path)).toContain('body.days');
        expect(await readUser(ids.user)).toMatchObject({ accStatus: 'active', suspendedUntil: null, suspensionReason: null });
    });

    it('takes a suspended organiser\'s events out of the lists, and reactivating brings them back', async () => {
        const listed = async () =>
            (await request(app).get('/api/v1/events').query({ q: `${PREFIX}Live` })).body.data.map((event) => event.name);

        expect(await listed()).toEqual([`${PREFIX}Live gig`]);
        expect((await setStatus(ids.organiser, { status: 'suspended', reason: 'Misleading dates', days: 7 })).status).toBe(200);
        expect(await listed()).toEqual([]);
        expect((await setStatus(ids.organiser, { status: 'active' })).status).toBe(200);
        expect(await listed()).toEqual([`${PREFIX}Live gig`]);
    });
});

describe('reactivating', () => {
    it('clears the suspension, logs it and tells the person, once', async () => {
        await setStatus(ids.user, { status: 'suspended', reason: 'Spam', days: 7 });
        const notesBefore = (await statusNotes(ids.user)).length;

        const res = await setStatus(ids.user, { status: 'active' });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ accStatus: 'active', suspendedUntil: null, suspensionReason: null });
        const notes = await statusNotes(ids.user);
        expect(notes).toHaveLength(notesBefore + 1);
        expect(notes.at(-1).subject).toBe('Account Reactivated');
        expect((await adminLogs('User Status Changed')).map((log) => log.details)).toContainEqual({
            userId: ids.user,
            username: `${PREFIX}user`,
            status: 'active',
        });
        expect((await agents.user.put('/api/v1/users/me/follows').send({ categories: [] })).status).toBe(200);

        // Already active: nothing new to tell
        expect((await setStatus(ids.user, { status: 'active' })).status).toBe(200);
        expect(await statusNotes(ids.user)).toHaveLength(notesBefore + 1);
    });
});

describe('deleting', () => {
    it('is for active admins only, and never an admin or yourself', async () => {
        expect((await removeAccount(ids.spare, agents.user)).status).toBe(403);
        expect((await removeAccount(ids.spare, agents.suspendedadmin)).status).toBe(403);
        expect((await removeAccount(ids.otheradmin)).status).toBe(403);
        expect((await removeAccount(ids.admin)).status).toBe(400);
        expect((await removeAccount(999999999)).status).toBe(404);
        expect(await readUser(ids.spare)).toBeDefined();
        expect(await readUser(ids.otheradmin)).toBeDefined();
    });

    it('refuses an organiser whose events have been public', async () => {
        const res = await removeAccount(ids.organiser);
        expect(res.status).toBe(409);
        expect(await readUser(ids.organiser)).toBeDefined();
        expect(await db.select().from(events).where(eq(events.organiserId, ids.organiser))).toHaveLength(3);
    });

    it('removes a user, ending their sessions, and logs it', async () => {
        const res = await removeAccount(ids.spare);

        expect(res.status).toBe(204);
        expect(await readUser(ids.spare)).toBeUndefined();
        expect((await agents.spare.get('/api/v1/auth/me')).status).toBe(401);
        expect((await adminLogs('User Deleted')).map((log) => log.details)).toContainEqual({
            userId: ids.spare,
            username: `${PREFIX}spare`,
            role: 'user',
            eventsDeleted: 0,
        });
    });

    it('removes an organiser\'s never-public events and every photo with them', async () => {
        const res = await removeAccount(ids.draftsonly);

        expect(res.status).toBe(204);
        expect(await readUser(ids.draftsonly)).toBeUndefined();
        expect(await db.select().from(events).where(eq(events.organiserId, ids.draftsonly))).toEqual([]);
        const deleted = vi.mocked(deleteImage).mock.calls.map(([publicId]) => publicId).filter(Boolean);
        expect(deleted.sort()).toEqual([`${PREFIX}avatar`, `${PREFIX}draft-photo`]);
    });
});
