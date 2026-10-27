import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq, gt, like, max } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, sessions, authTokens, systemLogs } from '../src/db/schema/index.js';
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
    // Sessions and tokens go with the users (ON DELETE CASCADE)
    await db.delete(users).where(like(users.email, `${EMAIL_PREFIX}%`));
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
