import { Agent } from 'node:http';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { expect } from 'vitest';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { events, users } from '../src/db/schema/index.js';

// Written out here rather than imported from the app, so a wrong value there
// can't make a test agree with it
export const PASSWORD = 'correct-horse-battery';
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const inDays = (days) => new Date(Date.now() + days * DAY);

// A time as the form's datetime-local sends it: Manchester's clock, YYYY-MM-DDTHH:mm
export const londonInput = (date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' })
        .format(date)
        .replace(' ', 'T');

export const testEmail = (prefix, name) => `${prefix}${name}@example.test`;

// Supertest closes the connection after each request, and on Windows an answer
// over 64 KB on a closing connection can stall 19 s. Keep-alive avoids it
const keepAlive = new Agent({ keepAlive: true });

// A Supertest agent: keeps its cookies, like a browser, and its connection
export function testAgent() {
    return request.agent(app).use((req) => req.agent(keepAlive));
}

// Verified accounts named `${prefix}${name}`, each [name, role, extra], with
// PASSWORD hashed at cost 4 rather than the app's 12, which only slows tests.
// Answers { name: userId }
export async function insertAccounts(prefix, accounts) {
    const password = await bcrypt.hash(PASSWORD, 4);
    const created = await db
        .insert(users)
        .values(accounts.map(([name, role, extra = {}]) => ({
            username: `${prefix}${name}`,
            email: testEmail(prefix, name),
            password,
            role,
            emailVerifiedAt: new Date(),
            ...extra,
        })))
        .returning();
    return Object.fromEntries(created.map((user) => [user.username.slice(prefix.length), user.userId]));
}

// A testAgent() logged in with PASSWORD
export async function logIn(email) {
    const agent = testAgent();
    const res = await agent.post('/api/v1/auth/login').send({ email, password: PASSWORD });
    expect(res.status, email).toBe(200);
    return agent;
}

// Logs in the named accounts of insertAccounts(); answers { name: agent }
export async function logInAll(prefix, names) {
    const agents = {};
    for (const name of names) agents[name] = await logIn(testEmail(prefix, name));
    return agents;
}

// An insertEvent(changes) for a file: an event ten days away, owned by
// ids.organiser at ids.venue in ids.category, read when it runs, after
// beforeAll has filled them in
export function eventInserter(ids, { eventName, status }) {
    return async (changes = {}) => {
        const [row] = await db
            .insert(events)
            .values({
                organiserId: ids.organiser,
                eventName,
                eventDescription: 'A test event.',
                startDatetime: inDays(10),
                locationId: ids.venue,
                categoryId: ids.category,
                ticketUrl: 'https://example.test/tickets',
                status,
                ...changes,
            })
            .returning();
        return row;
    };
}

export const readEvent = async (eventId) => (await db.select().from(events).where(eq(events.eventId, eventId)))[0];
