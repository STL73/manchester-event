import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { and, eq, inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, systemLogs, notifications } from '../src/db/schema/index.js';
import { createAuthToken } from '../src/lib/authTokens.js';

// No email leaves the tests: the password-changed email is only recorded
vi.mock('../src/lib/email.js', () => ({ sendEmail: vi.fn() }));

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'notifications-test-';
const PASSWORD = 'correct-horse-battery';
const HOUR = 60 * 60 * 1000;

const ids = {};
const agents = {};

beforeAll(async () => {
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
        .values([account('admin', 'admin'), account('user', 'user'), account('other', 'user'), account('suspended', 'organiser', { accStatus: 'suspended' })])
        .returning();
    for (const user of created) ids[user.username.slice(PREFIX.length)] = user.userId;

    for (const name of ['admin', 'user', 'other', 'suspended']) {
        const agent = request.agent(app);
        const res = await agent.post('/api/v1/auth/login').send({ email: `${PREFIX}${name}@example.test`, password: PASSWORD });
        expect(res.status, name).toBe(200);
        agents[name] = agent;
    }
});

afterAll(async () => {
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(systemLogs).where(inArray(systemLogs.userId, testUsers));
    // "New user" rows also reached the branch's own admin
    await db.delete(notifications).where(like(notifications.body, `%${PREFIX}%`));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
});

async function give(userId, rows) {
    return db
        .insert(notifications)
        .values(rows.map((row) => ({ userId, type: 'event_status', subject: 'Test', body: 'A test.', ...row })))
        .returning();
}
const inbox = (userId) => db.select().from(notifications).where(eq(notifications.userId, userId));

describe('the inbox', () => {
    it('needs a login', async () => {
        expect((await request(app).get('/api/v1/users/me/notifications')).status).toBe(401);
        expect((await request(app).put('/api/v1/users/me/notifications/read').send({ all: true })).status).toBe(401);
    });

    it('shows only the account\'s own, newest first, and works while suspended', async () => {
        const now = Date.now();
        await give(ids.user, [
            { subject: 'Older', createdAt: new Date(now - 2 * HOUR) },
            { subject: 'Newer', createdAt: new Date(now - HOUR), readAt: new Date(now) },
        ]);
        await give(ids.other, [{ subject: 'Someone else\'s' }]);
        await give(ids.suspended, [{ subject: 'While suspended' }]);

        const res = await agents.user.get('/api/v1/users/me/notifications');

        expect(res.status).toBe(200);
        expect(res.body.data.map((row) => row.subject)).toEqual(['Newer', 'Older']);
        expect(Object.keys(res.body.data[0]).sort()).toEqual(['body', 'createdAt', 'eventId', 'listed', 'notificationId', 'readAt', 'subject', 'type']);
        // No event, nothing to list
        expect(res.body.data[0].listed).toBe(false);
        expect(res.body.data[0].readAt).not.toBeNull();

        const suspended = await agents.suspended.get('/api/v1/users/me/notifications');
        expect(suspended.status).toBe(200);
        expect(suspended.body.data.map((row) => row.subject)).toEqual(['While suspended']);
    });
});

describe('marking read', () => {
    it('marks the chosen ones, and never someone else\'s', async () => {
        const [first, second] = await give(ids.user, [{ subject: 'First' }, { subject: 'Second' }]);
        const [theirs] = await give(ids.other, [{ subject: 'Theirs' }]);

        const res = await agents.user.put('/api/v1/users/me/notifications/read').send({ ids: [first.notificationId, theirs.notificationId] });

        expect(res.status).toBe(204);
        const mine = await inbox(ids.user);
        expect(mine.find((row) => row.notificationId === first.notificationId).readAt).not.toBeNull();
        expect(mine.find((row) => row.notificationId === second.notificationId).readAt).toBeNull();
        const [stillTheirs] = await db.select().from(notifications).where(eq(notifications.notificationId, theirs.notificationId));
        expect(stillTheirs.readAt).toBeNull();
    });

    it('keeps the first time it was read', async () => {
        const readAt = new Date(Date.now() - HOUR);
        const [row] = await give(ids.user, [{ subject: 'Read before', readAt }]);
        await agents.user.put('/api/v1/users/me/notifications/read').send({ ids: [row.notificationId] });
        const [after] = await db.select().from(notifications).where(eq(notifications.notificationId, row.notificationId));
        expect(after.readAt.getTime()).toBe(readAt.getTime());
    });

    it('marks them all with all: true, while suspended too', async () => {
        await give(ids.suspended, [{ subject: 'One' }, { subject: 'Two' }]);
        await give(ids.other, [{ subject: 'Not theirs' }]);

        expect((await agents.suspended.put('/api/v1/users/me/notifications/read').send({ all: true })).status).toBe(204);

        expect((await inbox(ids.suspended)).every((row) => row.readAt)).toBe(true);
        expect((await inbox(ids.other)).some((row) => !row.readAt)).toBe(true);
    });

    it('takes ids or all, not both or neither', async () => {
        for (const body of [{}, { ids: [] }, { ids: [1], all: true }, { all: false }, { ids: ['1'] }]) {
            expect((await agents.user.put('/api/v1/users/me/notifications/read').send(body)).status, JSON.stringify(body)).toBe(400);
        }
    });
});

describe('what accounts send', () => {
    it('tells the account when its password changes', async () => {
        const res = await agents.other.put('/api/v1/auth/password').send({ currentPassword: PASSWORD, newPassword: 'another-good-password' });

        expect(res.status).toBe(204);
        const rows = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.userId, ids.other), eq(notifications.type, 'password_changed')));
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ subject: 'Password Changed', eventId: null, readAt: null });
    });

    it('tells the account when a reset link changes its password', async () => {
        const token = await createAuthToken(ids.user, 'password_reset');

        const res = await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'a-new-good-password' });

        expect(res.status).toBe(204);
        const rows = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.userId, ids.user), eq(notifications.type, 'password_changed')));
        expect(rows).toHaveLength(1);
    });

    it('tells every admin about a new account, and nobody else', async () => {
        const email = `${PREFIX}new@example.test`;
        const res = await request(app).post('/api/v1/auth/sign-up').send({ username: `${PREFIX}new`, email, password: PASSWORD, role: 'user' });
        expect(res.status).toBe(201);

        const rows = await db
            .select({ userId: notifications.userId, role: users.role, body: notifications.body })
            .from(notifications)
            .innerJoin(users, eq(users.userId, notifications.userId))
            .where(and(eq(notifications.type, 'user_registered'), like(notifications.body, `%${email}%`)));
        expect(rows.map((row) => row.userId)).toContain(ids.admin);
        expect(rows.every((row) => row.role === 'admin')).toBe(true);
        expect(rows[0].body).toBe(`A new user has registered: ${PREFIX}new (${email}).`);
    });
});
