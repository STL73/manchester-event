import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq, gt, inArray, like, max } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, sessions, authTokens, systemLogs, events, categories, locations } from '../src/db/schema/index.js';
import { newToken, hashToken } from '../src/lib/tokens.js';
import { sendEmail } from '../src/lib/email.js';

// No real email in tests: each call is recorded, and the link is read from it
vi.mock('../src/lib/email.js', () => ({ sendEmail: vi.fn() }));

const DAY = 24 * 60 * 60 * 1000;
const PASSWORD = 'correct-horse-battery';
// Every account made here matches this, so afterAll can remove them all
const EMAIL_PREFIX = 'auth-test-';

let emailCount = 0;
const newEmail = () => `${EMAIL_PREFIX}${Date.now()}-${emailCount++}@example.test`;

let firstLogId;

beforeAll(async () => {
    const [row] = await db.select({ id: max(systemLogs.logId) }).from(systemLogs);
    firstLogId = row.id ?? 0;
});

beforeEach(() => {
    vi.mocked(sendEmail).mockReset();
});

afterAll(async () => {
    // Events first: they hold on to their organiser (RESTRICT). Sessions and
    // tokens go with the users (ON DELETE CASCADE)
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${EMAIL_PREFIX}%`));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${EMAIL_PREFIX}%`));
    await db.delete(locations).where(like(locations.placeId, `${EMAIL_PREFIX}%`));
    await db.delete(categories).where(like(categories.slug, `${EMAIL_PREFIX}%`));
    await db.delete(systemLogs).where(gt(systemLogs.logId, firstLogId));
});

function sessionCookie(res) {
    return res.headers['set-cookie']?.find((cookie) => cookie.startsWith('sid='));
}

function tokenFromLastEmail() {
    const { text } = vi.mocked(sendEmail).mock.lastCall[0];
    return text.match(/token=([a-f0-9]{64})/)[1];
}

// A signed-up account and an agent that carries its cookie
async function signUp(overrides = {}) {
    const agent = request.agent(app);
    const body = { username: 'Test Person', email: newEmail(), password: PASSWORD, role: 'user', ...overrides };
    const res = await agent.post('/api/v1/auth/sign-up').send(body);
    return { agent, res, body };
}

async function logsFor(userId) {
    return db.select().from(systemLogs).where(eq(systemLogs.userId, userId));
}

describe('sign-up', () => {
    it('creates the account, logs it in and emails a verification link', async () => {
        const { agent, res, body } = await signUp({ email: `${EMAIL_PREFIX}MiXeD-${Date.now()}@Example.TEST` });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({ username: 'Test Person', email: body.email.toLowerCase(), role: 'user' });
        expect(res.body.data.emailVerifiedAt).toBeNull();
        expect(res.body.data).not.toHaveProperty('password');

        const cookie = sessionCookie(res);
        expect(cookie).toMatch(/HttpOnly/);
        expect(cookie).toMatch(/SameSite=Lax/);

        expect(sendEmail).toHaveBeenCalledOnce();
        expect(vi.mocked(sendEmail).mock.lastCall[0].to).toBe(body.email.toLowerCase());

        const me = await agent.get('/api/v1/auth/me');
        expect(me.status).toBe(200);
        expect(me.body.data.userId).toBe(res.body.data.userId);

        const logs = await logsFor(res.body.data.userId);
        expect(logs.map((log) => log.action)).toContain('User Registered');
    });

    it('stores only a hash of the session ID', async () => {
        const { res } = await signUp();
        const token = sessionCookie(res).split(';')[0].slice('sid='.length);
        const rows = await db.select().from(sessions).where(eq(sessions.userId, res.body.data.userId));
        expect(rows).toHaveLength(1);
        expect(rows[0].sessionId).toBe(hashToken(token));
        expect(rows[0].sessionId).not.toBe(token);
    });

    it('refuses an email that already has an account, whatever its case', async () => {
        const { body } = await signUp();
        const res = await request(app)
            .post('/api/v1/auth/sign-up')
            .send({ ...body, email: body.email.toUpperCase() });
        expect(res.status).toBe(409);
        expect(res.body.error.details).toEqual([
            { path: 'body.email', message: 'An account with this email already exists. Log in instead?' },
        ]);
    });

    it('refuses the admin role', async () => {
        const { res } = await signUp({ role: 'admin' });
        expect(res.status).toBe(400);
        expect(res.body.error.details.map((d) => d.path)).toEqual(['body.role']);
    });

    it('refuses a short password', async () => {
        const { res } = await signUp({ password: 'short' });
        expect(res.status).toBe(400);
        expect(res.body.error.details).toEqual([{ path: 'body.password', message: 'This password is too short.' }]);
    });
});

describe('login', () => {
    it('logs in with the right password and starts a new session each time', async () => {
        const { res: signUpRes, body } = await signUp();
        const first = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: PASSWORD });
        const second = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: PASSWORD });

        expect(first.status).toBe(200);
        expect(first.body.data.email).toBe(body.email);
        expect(sessionCookie(first)).not.toBe(sessionCookie(second));
        expect(sessionCookie(first)).not.toBe(sessionCookie(signUpRes));

        const logs = await logsFor(first.body.data.userId);
        expect(logs.filter((log) => log.action === 'User Login')).toHaveLength(2);
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
        const { res: signUpRes, body } = await signUp();
        const unknownEmail = newEmail();
        const wrongPassword = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: 'wrong-password' });
        const unknown = await request(app).post('/api/v1/auth/login').send({ email: unknownEmail, password: PASSWORD });

        expect(wrongPassword.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(wrongPassword.body).toEqual(unknown.body);
        expect(sessionCookie(wrongPassword)).toBeUndefined();

        // The failure on a real account is linked to it
        const logs = await logsFor(signUpRes.body.data.userId);
        expect(logs.find((log) => log.action === 'User Login Failed').details.reason).toBe('Wrong password');

        // An email with no account is never stored
        const anonymous = await db.select().from(systemLogs).where(gt(systemLogs.logId, firstLogId));
        expect(JSON.stringify(anonymous)).not.toContain(unknownEmail);
    });

    it('lets a suspended account log in, flagged as suspended', async () => {
        const { res: signUpRes, body } = await signUp();
        await db.update(users).set({ accStatus: 'suspended', suspendedUntil: null }).where(eq(users.userId, signUpRes.body.data.userId));

        const res = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.data.accStatus).toBe('suspended');
    });

    it('lifts a suspension whose end date has passed', async () => {
        const { res: signUpRes, body } = await signUp();
        await db
            .update(users)
            .set({ accStatus: 'suspended', suspendedUntil: new Date(Date.now() - DAY), suspensionReason: 'Spam' })
            .where(eq(users.userId, signUpRes.body.data.userId));

        const res = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: PASSWORD });
        expect(res.body.data).toMatchObject({ accStatus: 'active', suspendedUntil: null, suspensionReason: null });
    });
});

describe('sessions', () => {
    // A session row made directly, ending `days` from now, and its cookie
    async function sessionEndingIn(days) {
        const { res } = await signUp();
        const { token, hash } = newToken();
        await db.insert(sessions).values({ sessionId: hash, userId: res.body.data.userId, expiresAt: new Date(Date.now() + days * DAY) });
        return { cookie: `sid=${token}`, hash };
    }

    it('refuses a request with no cookie or an unknown one', async () => {
        const none = await request(app).get('/api/v1/auth/me');
        const unknown = await request(app).get('/api/v1/auth/me').set('Cookie', `sid=${newToken().token}`);
        expect(none.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(sessionCookie(unknown)).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('refuses an expired session', async () => {
        const { cookie } = await sessionEndingIn(-1);
        const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
        expect(res.status).toBe(401);
    });

    it('moves a session forward when fewer than 15 days are left', async () => {
        const { cookie, hash } = await sessionEndingIn(10);
        const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(sessionCookie(res)).toBeDefined();
        const [row] = await db.select().from(sessions).where(eq(sessions.sessionId, hash));
        expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
    });

    it('leaves a session with more than 15 days alone', async () => {
        const { cookie } = await sessionEndingIn(20);
        const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(sessionCookie(res)).toBeUndefined();
    });

    it('ends the session on logout', async () => {
        const { agent, res: signUpRes } = await signUp();
        const res = await agent.post('/api/v1/auth/logout');
        expect(res.status).toBe(204);
        expect((await agent.get('/api/v1/auth/me')).status).toBe(401);

        const rows = await db.select().from(sessions).where(eq(sessions.userId, signUpRes.body.data.userId));
        expect(rows).toHaveLength(0);
    });
});

describe('email verification', () => {
    it('verifies with the emailed link, once', async () => {
        const { agent } = await signUp();
        const token = tokenFromLastEmail();

        const res = await request(app).post('/api/v1/auth/verify-email').send({ token });
        expect(res.status).toBe(200);
        expect((await agent.get('/api/v1/auth/me')).body.data.emailVerifiedAt).not.toBeNull();

        const again = await request(app).post('/api/v1/auth/verify-email').send({ token });
        expect(again.status).toBe(400);
    });

    it('refuses an expired link', async () => {
        const { res: signUpRes } = await signUp();
        const token = tokenFromLastEmail();
        await db
            .update(authTokens)
            .set({ expiresAt: new Date(Date.now() - 1000) })
            .where(eq(authTokens.userId, signUpRes.body.data.userId));

        const res = await request(app).post('/api/v1/auth/verify-email').send({ token });
        expect(res.status).toBe(400);
    });

    it('sends a new link that replaces the old one', async () => {
        const { agent } = await signUp();
        const oldToken = tokenFromLastEmail();

        const res = await agent.post('/api/v1/auth/resend-verification');
        expect(res.status).toBe(204);
        const newTokenValue = tokenFromLastEmail();
        expect(newTokenValue).not.toBe(oldToken);

        expect((await request(app).post('/api/v1/auth/verify-email').send({ token: oldToken })).status).toBe(400);
        expect((await request(app).post('/api/v1/auth/verify-email').send({ token: newTokenValue })).status).toBe(200);
    });

    it('needs a login to resend, and refuses once verified', async () => {
        expect((await request(app).post('/api/v1/auth/resend-verification')).status).toBe(401);

        const { agent } = await signUp();
        await request(app).post('/api/v1/auth/verify-email').send({ token: tokenFromLastEmail() });
        const res = await agent.post('/api/v1/auth/resend-verification');
        expect(res.status).toBe(400);
    });

    it('keeps the account when the email fails, and logs the failure', async () => {
        vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP down'));
        const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { res } = await signUp();
        errorLog.mockRestore();

        expect(res.status).toBe(201);
        const logs = await logsFor(res.body.data.userId);
        expect(logs.map((log) => log.action)).toContain('Email Failed');
    });
});

const NEW_PASSWORD = 'a-brand-new-password';

async function suspend(userId) {
    await db.update(users).set({ accStatus: 'suspended', suspendedUntil: null }).where(eq(users.userId, userId));
}

describe('forgot and reset password', () => {
    // The reset email is sent without the reply waiting for it
    async function requestReset(email) {
        const res = await request(app).post('/api/v1/auth/forgot-password').send({ email });
        await vi.waitFor(() => expect(sendEmail).toHaveBeenCalled());
        return res;
    }

    it('gives the same reply for an unknown email and sends nothing', async () => {
        const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: newEmail() });
        expect(res.status).toBe(204);
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('resets with the emailed link: every session ends and only the new password works', async () => {
        const { agent, body } = await signUp();
        vi.mocked(sendEmail).mockReset();

        expect((await requestReset(body.email.toUpperCase())).status).toBe(204);
        const token = tokenFromLastEmail();
        expect(vi.mocked(sendEmail).mock.lastCall[0].text).toContain('/auth/reset-password?token=');

        const res = await request(app).post('/api/v1/auth/reset-password').send({ token, password: NEW_PASSWORD });
        expect(res.status).toBe(204);
        expect((await agent.get('/api/v1/auth/me')).status).toBe(401);

        const oldLogin = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: PASSWORD });
        const newLogin = await request(app).post('/api/v1/auth/login').send({ email: body.email, password: NEW_PASSWORD });
        expect(oldLogin.status).toBe(401);
        expect(newLogin.status).toBe(200);
        // The link reached the inbox, so the email counts as verified
        expect(newLogin.body.data.emailVerifiedAt).not.toBeNull();

        expect(vi.mocked(sendEmail).mock.lastCall[0].subject).toMatch(/password was changed/);
        const again = await request(app).post('/api/v1/auth/reset-password').send({ token, password: NEW_PASSWORD });
        expect(again.status).toBe(400);
    });

    it("won't take a verification link as a reset link", async () => {
        await signUp();
        const res = await request(app).post('/api/v1/auth/reset-password').send({ token: tokenFromLastEmail(), password: NEW_PASSWORD });
        expect(res.status).toBe(400);
    });

    it('refuses a short new password', async () => {
        const res = await request(app).post('/api/v1/auth/reset-password').send({ token: newToken().token, password: 'short' });
        expect(res.status).toBe(400);
        expect(res.body.error.details).toEqual([{ path: 'body.password', message: 'This password is too short.' }]);
    });
});

describe('change password', () => {
    it('refuses a wrong current password under its field', async () => {
        const { agent } = await signUp();
        const res = await agent.put('/api/v1/auth/password').send({ currentPassword: 'wrong-password', newPassword: NEW_PASSWORD });
        expect(res.status).toBe(400);
        expect(res.body.error.details.map((d) => d.path)).toEqual(['body.currentPassword']);
    });

    it('logs out every other device and keeps this one with a new session', async () => {
        const { agent, res: signUpRes, body } = await signUp();
        const otherDevice = request.agent(app);
        await otherDevice.post('/api/v1/auth/login').send({ email: body.email, password: PASSWORD });

        const res = await agent.put('/api/v1/auth/password').send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
        expect(res.status).toBe(204);
        expect(sessionCookie(res)).not.toBe(sessionCookie(signUpRes));
        expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
        expect((await otherDevice.get('/api/v1/auth/me')).status).toBe(401);

        const rows = await db.select().from(sessions).where(eq(sessions.userId, signUpRes.body.data.userId));
        expect(rows).toHaveLength(1);
        expect(vi.mocked(sendEmail).mock.lastCall[0].subject).toMatch(/password was changed/);
        const logs = await logsFor(signUpRes.body.data.userId);
        expect(logs.find((log) => log.action === 'Password Changed').details).toEqual({ via: 'settings' });
    });

    it('is allowed while suspended', async () => {
        const { agent, res: signUpRes } = await signUp();
        await suspend(signUpRes.body.data.userId);
        const res = await agent.put('/api/v1/auth/password').send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
        expect(res.status).toBe(204);
    });
});

describe('profile', () => {
    it('saves the display name and the email switch, each on its own', async () => {
        const { agent } = await signUp();
        const name = await agent.put('/api/v1/users/me').send({ username: '  New Name  ' });
        expect(name.status).toBe(200);
        expect(name.body.data).toMatchObject({ username: 'New Name', emailNotifications: true });

        const emails = await agent.put('/api/v1/users/me').send({ emailNotifications: false });
        expect(emails.body.data).toMatchObject({ username: 'New Name', emailNotifications: false });
        expect(emails.body.data).not.toHaveProperty('password');
    });

    it('ignores fields the form has no business sending', async () => {
        const { agent } = await signUp();
        const res = await agent.put('/api/v1/users/me').send({ username: 'Sneaky', role: 'admin', emailVerifiedAt: new Date() });
        expect(res.body.data).toMatchObject({ username: 'Sneaky', role: 'user', emailVerifiedAt: null });
    });

    it('refuses an empty change, no login, and a suspended account', async () => {
        const { agent, res: signUpRes } = await signUp();
        expect((await agent.put('/api/v1/users/me').send({})).status).toBe(400);
        expect((await request(app).put('/api/v1/users/me').send({ username: 'X' })).status).toBe(401);

        await suspend(signUpRes.body.data.userId);
        expect((await agent.put('/api/v1/users/me').send({ username: 'X' })).status).toBe(403);
    });
});

describe('delete account', () => {
    let categoryId;
    let locationId;

    beforeAll(async () => {
        [{ categoryId }] = await db
            .insert(categories)
            .values({ slug: `${EMAIL_PREFIX}${Date.now()}`, name: `${EMAIL_PREFIX}${Date.now()}` })
            .returning();
        [{ locationId }] = await db
            .insert(locations)
            .values({ placeId: `${EMAIL_PREFIX}${Date.now()}`, locationName: 'Test venue', address: 'Manchester', latitude: 53.48, longitude: -2.24 })
            .returning();
    });

    async function addEvent(organiserId, values) {
        const [event] = await db
            .insert(events)
            .values({ organiserId, categoryId, locationId, eventName: 'Test event', eventDescription: 'Test', startDatetime: new Date(Date.now() + 7 * DAY), ...values })
            .returning();
        return event;
    }

    const eventExists = async (eventId) => (await db.select().from(events).where(eq(events.eventId, eventId))).length === 1;

    it('refuses a wrong password and keeps the account', async () => {
        const { agent } = await signUp();
        const res = await agent.delete('/api/v1/users/me').send({ password: 'wrong-password' });
        expect(res.status).toBe(400);
        expect(res.body.error.details.map((d) => d.path)).toEqual(['body.password']);
        expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
    });

    it('deletes the account, logs it and logs the person out', async () => {
        const { agent, res: signUpRes } = await signUp();
        const { userId } = signUpRes.body.data;
        const res = await agent.delete('/api/v1/users/me').send({ password: PASSWORD });
        expect(res.status).toBe(204);
        expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
        expect(await db.select().from(users).where(eq(users.userId, userId))).toHaveLength(0);

        // No account left to link to; the name and role are copied
        const logs = await db.select().from(systemLogs).where(gt(systemLogs.logId, firstLogId));
        const deleted = logs.find((row) => row.action === 'Account Deleted' && row.details.userId === userId);
        expect(deleted).toMatchObject({ userId: null, username: 'Test Person', role: 'user', details: { userId, eventsDeleted: 0 } });
    });

    it("deletes an organiser's events that were never public along with the account", async () => {
        const { agent, res: signUpRes } = await signUp({ role: 'organiser' });
        const { userId } = signUpRes.body.data;
        const draft = await addEvent(userId, { status: 'draft' });
        const rejected = await addEvent(userId, { status: 'rejected', rejectionReason: 'Test' });

        const res = await agent.delete('/api/v1/users/me').send({ password: PASSWORD });
        expect(res.status).toBe(204);
        expect(await eventExists(draft.eventId)).toBe(false);
        expect(await eventExists(rejected.eventId)).toBe(false);
    });

    it.each([
        ['approved', { status: 'approved' }],
        ['cancelled', { status: 'cancelled' }],
        ['an edit of an approved event waiting for review', { status: 'pending', approvedSnapshot: { eventName: 'Test event' } }],
    ])('refuses an organiser with an event that has been public: %s', async (_, values) => {
        const { agent, res: signUpRes } = await signUp({ role: 'organiser' });
        const { userId } = signUpRes.body.data;
        const draft = await addEvent(userId, { status: 'draft' });
        const publicEvent = await addEvent(userId, values);

        const res = await agent.delete('/api/v1/users/me').send({ password: PASSWORD });
        expect(res.status).toBe(409);
        expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
        expect(await eventExists(draft.eventId)).toBe(true);
        expect(await eventExists(publicEvent.eventId)).toBe(true);
    });

    it('refuses an admin and a suspended account', async () => {
        const admin = await signUp();
        await db.update(users).set({ role: 'admin' }).where(eq(users.userId, admin.res.body.data.userId));
        expect((await admin.agent.delete('/api/v1/users/me').send({ password: PASSWORD })).status).toBe(403);

        const suspended = await signUp();
        await suspend(suspended.res.body.data.userId);
        expect((await suspended.agent.delete('/api/v1/users/me').send({ password: PASSWORD })).status).toBe(403);
    });
});
