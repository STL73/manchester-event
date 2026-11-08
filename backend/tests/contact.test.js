import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { eq, inArray, like, or } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, contactMessages, systemLogs } from '../src/db/schema/index.js';
import { sendEmail } from '../src/lib/email.js';

// No email leaves the tests; sendEmail only records what it was asked to send
vi.mock('../src/lib/email.js', () => ({ sendEmail: vi.fn() }));

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'contact-test-';
const PASSWORD = 'correct-horse-battery';

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
        .values([
            account('admin', 'admin'),
            account('suspendedadmin', 'admin', { accStatus: 'suspended' }),
            account('user', 'user'),
            account('suspended', 'user', { accStatus: 'suspended', suspensionReason: 'Test' }),
            account('organiser', 'organiser'),
        ])
        .returning();
    for (const user of created) ids[user.username.slice(PREFIX.length)] = user.userId;

    for (const name of ['admin', 'suspendedadmin', 'user', 'suspended', 'organiser']) {
        const agent = request.agent(app);
        const res = await agent.post('/api/v1/auth/login').send({ email: `${PREFIX}${name}@example.test`, password: PASSWORD });
        expect(res.status, name).toBe(200);
        agents[name] = agent;
    }
});

afterAll(async () => {
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(systemLogs).where(inArray(systemLogs.userId, testUsers));
    await db
        .delete(contactMessages)
        .where(or(like(contactMessages.email, `${PREFIX}%`), like(contactMessages.name, `${PREFIX}%`)));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
});

beforeEach(() => {
    vi.mocked(sendEmail).mockReset();
});

const guestMessage = (extra = {}) => ({
    name: `${PREFIX}Guest`,
    email: `${PREFIX}guest@example.test`,
    message: 'When does the Christmas market open?',
    ...extra,
});

async function readMessage(messageId) {
    const [row] = await db.select().from(contactMessages).where(eq(contactMessages.messageId, messageId));
    return row;
}

async function insertMessage(extra = {}) {
    const [row] = await db
        .insert(contactMessages)
        .values({ name: `${PREFIX}Sender`, email: `${PREFIX}sender@example.test`, message: 'Hello\nthere', ...extra })
        .returning();
    return row;
}

describe('POST /api/v1/contact-messages', () => {
    it('stores a guest message as typed, trimmed', async () => {
        const res = await request(app).post('/api/v1/contact-messages').send(guestMessage({ message: '  Hello  ' }));
        expect(res.status).toBe(201);
        const row = await readMessage(res.body.data.messageId);
        expect(row).toMatchObject({
            userId: null,
            name: `${PREFIX}Guest`,
            email: `${PREFIX}guest@example.test`,
            message: 'Hello',
            readAt: null,
            repliedAt: null,
        });
    });

    it('takes a signed-in sender from the account, ignoring a typed name and email', async () => {
        const res = await agents.user
            .post('/api/v1/contact-messages')
            .send({ name: 'Someone else', email: 'forged@example.test', message: 'Is there parking?' });
        expect(res.status).toBe(201);
        expect(await readMessage(res.body.data.messageId)).toMatchObject({
            userId: ids.user,
            name: `${PREFIX}user`,
            email: `${PREFIX}user@example.test`,
            message: 'Is there parking?',
        });
    });

    it('lets organisers and suspended accounts write, but not admins', async () => {
        expect((await agents.organiser.post('/api/v1/contact-messages').send({ message: 'Hi' })).status).toBe(201);
        const suspended = await agents.suspended.post('/api/v1/contact-messages').send({ message: 'Why am I suspended?' });
        expect(suspended.status).toBe(201);
        expect((await readMessage(suspended.body.data.messageId)).userId).toBe(ids.suspended);
        expect((await agents.admin.post('/api/v1/contact-messages').send({ message: 'Hi' })).status).toBe(403);
    });

    it('drops a message whose hidden field was filled, while saying it went', async () => {
        const before = await db.select().from(contactMessages).where(like(contactMessages.email, `${PREFIX}bot%`));
        const res = await request(app)
            .post('/api/v1/contact-messages')
            .send(guestMessage({ email: `${PREFIX}bot@example.test`, website: 'https://spam.example' }));
        expect(res.status).toBe(201);
        const after = await db.select().from(contactMessages).where(like(contactMessages.email, `${PREFIX}bot%`));
        expect(after.length).toBe(before.length);
    });

    it('needs a name, a valid email and a message from a guest', async () => {
        const res = await request(app).post('/api/v1/contact-messages').send({ name: ' ', email: 'not-an-email', message: '' });
        expect(res.status).toBe(400);
        expect(res.body.error.details.map((detail) => detail.path).sort()).toEqual(['body.email', 'body.message', 'body.name']);
        const signedIn = await agents.user.post('/api/v1/contact-messages').send({ message: '   ' });
        expect(signedIn.status).toBe(400);
        expect(signedIn.body.error.details).toEqual([{ path: 'body.message', message: 'Write your message.' }]);
        const long = await request(app).post('/api/v1/contact-messages').send(guestMessage({ message: 'x'.repeat(5001) }));
        expect(long.status).toBe(400);
    });
});

describe('GET /api/v1/contact-messages', () => {
    it('is for admins only, suspended or not', async () => {
        expect((await request(app).get('/api/v1/contact-messages')).status).toBe(401);
        expect((await agents.user.get('/api/v1/contact-messages')).status).toBe(403);
        expect((await agents.organiser.get('/api/v1/contact-messages')).status).toBe(403);
        expect((await agents.suspendedadmin.get('/api/v1/contact-messages')).status).toBe(200);
    });

    it('lists every message newest first, with who replied', async () => {
        const older = await insertMessage({ createdAt: new Date(Date.now() - 60 * 60 * 1000) });
        const replied = await insertMessage({ repliedAt: new Date(), repliedBy: ids.admin, replyBody: 'Yes' });
        const res = await agents.admin.get('/api/v1/contact-messages');
        expect(res.status).toBe(200);
        const list = res.body.data;
        const times = list.map((row) => row.createdAt);
        expect(times).toEqual([...times].sort().reverse());
        expect(list.findIndex((row) => row.messageId === replied.messageId)).toBeLessThan(
            list.findIndex((row) => row.messageId === older.messageId),
        );
        expect(list.find((row) => row.messageId === replied.messageId)).toMatchObject({
            repliedBy: ids.admin,
            repliedByName: `${PREFIX}admin`,
            replyBody: 'Yes',
        });
        expect(list.find((row) => row.messageId === older.messageId).repliedByName).toBeNull();
    });
});

describe('PUT /api/v1/contact-messages/:id/read', () => {
    it('reads and unreads, keeping the first time it was read', async () => {
        const message = await insertMessage();
        const first = await agents.admin.put(`/api/v1/contact-messages/${message.messageId}/read`).send({ read: true });
        expect(first.status).toBe(200);
        const readAt = (await readMessage(message.messageId)).readAt;
        expect(readAt).not.toBeNull();
        expect(first.body.data.readAt).toBe(readAt.toISOString());

        const again = await agents.admin.put(`/api/v1/contact-messages/${message.messageId}/read`).send({ read: true });
        expect(new Date(again.body.data.readAt)).toEqual(readAt);

        const unread = await agents.admin.put(`/api/v1/contact-messages/${message.messageId}/read`).send({ read: false });
        expect(unread.body.data.readAt).toBeNull();
        expect((await readMessage(message.messageId)).readAt).toBeNull();
    });

    it('refuses other roles, a suspended admin, bad input and unknown messages', async () => {
        const message = await insertMessage();
        const path = `/api/v1/contact-messages/${message.messageId}/read`;
        expect((await agents.user.put(path).send({ read: true })).status).toBe(403);
        expect((await agents.suspendedadmin.put(path).send({ read: true })).status).toBe(403);
        expect((await agents.admin.put(path).send({ read: 'yes' })).status).toBe(400);
        expect((await agents.admin.put('/api/v1/contact-messages/999999999/read').send({ read: true })).status).toBe(404);
        expect((await readMessage(message.messageId)).readAt).toBeNull();
    });
});

describe('PUT /api/v1/contact-messages/:id/reply', () => {
    it('emails the reply to the sender, stores it and logs it', async () => {
        const message = await insertMessage();
        const res = await agents.admin
            .put(`/api/v1/contact-messages/${message.messageId}/reply`)
            .send({ reply: '  Opens on the 14th.  ' });
        expect(res.status).toBe(200);

        expect(sendEmail).toHaveBeenCalledTimes(1);
        const email = vi.mocked(sendEmail).mock.calls[0][0];
        expect(email.to).toBe(`${PREFIX}sender@example.test`);
        expect(email.subject).toBe('Re: your message to Manchester Event Portal');
        expect(email.text).toContain('Opens on the 14th.');
        expect(email.text).toContain('> Hello\n> there');
        expect(email.text).toMatch(/On \d{1,2} \w+ \d{4} you wrote:/);

        const row = await readMessage(message.messageId);
        expect(row).toMatchObject({ replyBody: 'Opens on the 14th.', repliedBy: ids.admin });
        expect(row.repliedAt).not.toBeNull();
        // Answering it reads it
        expect(row.readAt).toEqual(row.repliedAt);
        expect(res.body.data).toMatchObject({ replyBody: 'Opens on the 14th.', repliedByName: `${PREFIX}admin` });

        const logs = await db.select().from(systemLogs).where(eq(systemLogs.action, 'Contact Message Replied'));
        expect(logs.find((log) => log.details.messageId === message.messageId)).toMatchObject({
            userId: ids.admin,
            details: { messageId: message.messageId, name: `${PREFIX}Sender` },
        });
    });

    it('keeps an earlier read time', async () => {
        const readAt = new Date(Date.now() - 60 * 60 * 1000);
        const message = await insertMessage({ readAt });
        await agents.admin.put(`/api/v1/contact-messages/${message.messageId}/reply`).send({ reply: 'Thanks' });
        expect((await readMessage(message.messageId)).readAt).toEqual(readAt);
    });

    it('answers a message only once', async () => {
        const message = await insertMessage();
        const path = `/api/v1/contact-messages/${message.messageId}/reply`;
        expect((await agents.admin.put(path).send({ reply: 'First' })).status).toBe(200);
        const second = await agents.admin.put(path).send({ reply: 'Second' });
        expect(second.status).toBe(409);
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect((await readMessage(message.messageId)).replyBody).toBe('First');
    });

    it('sends one email when two admins reply at the same moment', async () => {
        const message = await insertMessage();
        const path = `/api/v1/contact-messages/${message.messageId}/reply`;
        const answers = await Promise.all([
            agents.admin.put(path).send({ reply: 'One' }),
            agents.admin.put(path).send({ reply: 'Two' }),
        ]);
        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        expect(sendEmail).toHaveBeenCalledTimes(1);
        const winner = answers.find((res) => res.status === 200).body.data.replyBody;
        expect((await readMessage(message.messageId)).replyBody).toBe(winner);
    });

    it('keeps nothing when the email fails, so it can be tried again', async () => {
        vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Connection closed'));
        const message = await insertMessage();
        const path = `/api/v1/contact-messages/${message.messageId}/reply`;
        const res = await agents.admin.put(path).send({ reply: 'Lost' });
        expect(res.status).toBe(503);
        expect(await readMessage(message.messageId)).toMatchObject({ replyBody: null, repliedAt: null, repliedBy: null, readAt: null });

        const logs = await db.select().from(systemLogs).where(eq(systemLogs.userId, ids.admin));
        expect(logs.some((log) => log.action === 'Email Failed' && log.details.email === 'contact reply')).toBe(true);
        expect(logs.some((log) => log.action === 'Contact Message Replied' && log.details.messageId === message.messageId)).toBe(false);

        expect((await agents.admin.put(path).send({ reply: 'Found' })).status).toBe(200);
    });

    it('refuses other roles, a suspended admin, an empty reply and unknown messages', async () => {
        const message = await insertMessage();
        const path = `/api/v1/contact-messages/${message.messageId}/reply`;
        expect((await request(app).put(path).send({ reply: 'Hi' })).status).toBe(401);
        expect((await agents.organiser.put(path).send({ reply: 'Hi' })).status).toBe(403);
        expect((await agents.suspendedadmin.put(path).send({ reply: 'Hi' })).status).toBe(403);
        const empty = await agents.admin.put(path).send({ reply: '  ' });
        expect(empty.status).toBe(400);
        expect(empty.body.error.details).toEqual([{ path: 'body.reply', message: 'Write a reply first.' }]);
        expect((await agents.admin.put('/api/v1/contact-messages/999999999/reply').send({ reply: 'Hi' })).status).toBe(404);
        expect(sendEmail).not.toHaveBeenCalled();
        expect((await readMessage(message.messageId)).repliedAt).toBeNull();
    });
});
