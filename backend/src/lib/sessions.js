import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema/index.js';
import { NODE_ENV } from '../config/env.js';
import { newToken, hashToken } from './tokens.js';

export const SESSION_COOKIE = 'sid';

const DAY = 24 * 60 * 60 * 1000;
const SESSION_LENGTH = 30 * DAY;
// A session used with fewer days than this left is moved forward, so someone
// who visits at least every two weeks stays signed in (decided 2026-10-26)
const RENEW_WITHIN = 15 * DAY;

// httpOnly: page scripts can't read it, so an XSS bug can't steal it.
// sameSite lax: other sites can link here but can't send forms with it
const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    path: '/',
};

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_LENGTH });
}

export function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE, cookieOptions);
}

// A new session ID at every login, so an ID someone planted before login is worthless
export async function startSession(res, userId) {
    const { token, hash } = newToken();
    // The user's expired sessions are tidied up here rather than by a scheduled job
    await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
    await db.insert(sessions).values({ sessionId: hash, userId, expiresAt: new Date(Date.now() + SESSION_LENGTH) });
    setSessionCookie(res, token);
}

// The session and its user for a cookie value, or null if it's missing, unknown or expired
export async function findSession(token) {
    if (!token) return null;
    const [row] = await db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(users.userId, sessions.userId))
        .where(and(eq(sessions.sessionId, hashToken(token)), gt(sessions.expiresAt, new Date())));
    return row ?? null;
}

export async function renewSessionIfDue(res, token, session) {
    if (session.expiresAt.getTime() - Date.now() > RENEW_WITHIN) return;
    await db
        .update(sessions)
        .set({ expiresAt: new Date(Date.now() + SESSION_LENGTH) })
        .where(eq(sessions.sessionId, session.sessionId));
    setSessionCookie(res, token);
}

export async function endSession(res, token) {
    if (token) await db.delete(sessions).where(eq(sessions.sessionId, hashToken(token)));
    clearSessionCookie(res);
}
