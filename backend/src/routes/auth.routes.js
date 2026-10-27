import { Router } from "express";
import bcrypt from 'bcryptjs';
import { and, eq, isNull } from 'drizzle-orm';
import { protectSignup, slidingWindow } from '@arcjet/node';

import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { aj } from '../config/arcjet.js';
import { LOG } from '../constants/logActions.js';
import { AppError } from '../lib/errors.js';
import {
    SESSION_COOKIE, startSession, findSession, endSession, endAllSessions, clearSessionCookie,
} from '../lib/sessions.js';
import { consumeAuthToken } from '../lib/authTokens.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../lib/authEmails.js';
import { logAction } from '../lib/systemLogs.js';
import { publicUser, liftExpiredSuspension } from '../lib/users.js';
import { validate } from '../middleware/validate.js';
import { arcjetProtect } from '../middleware/security.js';
import { requireAuth } from '../middleware/auth.js';
import {
    signUpSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema,
} from '../validation/auth.js';

const authRouter = Router();

const BCRYPT_COST = 12;

// Stricter Arcjet rules for these routes, made once here (null in tests).
// Limits decided 2026-10-26
const signUpGuard = aj?.withRule(protectSignup({
    email: { mode: 'LIVE', deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'] },
    bots: { mode: 'LIVE', allow: [] },
    rateLimit: { mode: 'LIVE', interval: '1h', max: 5 },
}));
const loginGuard = aj?.withRule(slidingWindow({ mode: 'LIVE', interval: '15m', max: 10 }));
const resendGuard = aj?.withRule(slidingWindow({ mode: 'LIVE', characteristics: ['userId'], interval: '1h', max: 3 }));
// Per address, so nobody can fill an inbox with reset emails, and per IP, so
// nobody can send one to every address they can think of
const forgotGuard = aj
    ?.withRule(slidingWindow({ mode: 'LIVE', characteristics: ['resetEmail'], interval: '1h', max: 3 }))
    .withRule(slidingWindow({ mode: 'LIVE', interval: '1h', max: 10 }));
// The same limit as login: the current password can't be guessed from a stolen session
const passwordGuard = aj?.withRule(slidingWindow({ mode: 'LIVE', characteristics: ['userId'], interval: '15m', max: 10 }));

// Compared against when an email has no account, so a wrong email takes as long
// as a wrong password and the response time can't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('no-account-has-this-password', BCRYPT_COST);

authRouter.post(
    '/sign-up',
    validate({ body: signUpSchema }),
    arcjetProtect(signUpGuard, (req) => ({ email: req.valid.body.email })),
    async (req, res) => {
        const { username, email, password, role } = req.valid.body;

        // The unique email decides, so two sign-ups at the same moment can't both get in
        const [user] = await db
            .insert(users)
            .values({ username, email, password: await bcrypt.hash(password, BCRYPT_COST), role })
            .onConflictDoNothing({ target: users.email })
            .returning();
        // Said plainly (decided 2026-10-26): the rate limit stops anyone testing emails in bulk
        if (!user) {
            const message = 'An account with this email already exists. Log in instead?';
            throw new AppError(409, message, [{ path: 'body.email', message }]);
        }

        await logAction(LOG.USER_REGISTERED, user, { role, email });
        // Logged in straight away; an unverified account can do everything but submit events.
        // If the email fails the account still stands, and Settings can send another
        await startSession(res, user.userId);
        await sendVerificationEmail(user);
        res.status(201).json({ data: publicUser(user) });
    },
);

authRouter.post('/login', arcjetProtect(loginGuard), validate({ body: loginSchema }), async (req, res) => {
    const { email, password } = req.valid.body;
    const [found] = await db.select().from(users).where(eq(users.email, email));
    const matches = await bcrypt.compare(password, found?.password ?? DUMMY_HASH);

    if (!found || !matches) {
        // Linked to the account when the email has one. An email with no
        // account is never stored, only the address the attempt came from
        await logAction(LOG.USER_LOGIN_FAILED, found ?? null, {
            reason: found ? 'Wrong password' : 'No account with this email',
            ip: req.ip,
        });
        // One message for both, so the form can't be used to find out who has an account
        throw new AppError(401, 'Email or password is incorrect');
    }

    // A suspended account can still log in, read-only with a banner
    const user = await liftExpiredSuspension(found);
    await startSession(res, user.userId);
    await logAction(LOG.USER_LOGIN, user, { ip: req.ip });
    res.json({ data: publicUser(user) });
});

authRouter.post('/logout', async (req, res) => {
    const token = req.cookies[SESSION_COOKIE];
    const found = await findSession(token);
    await endSession(res, token);
    if (found) await logAction(LOG.USER_LOGOUT, found.user);
    res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
    res.json({ data: publicUser(req.user) });
});

// No login needed: the link may be opened on another device
authRouter.post('/verify-email', validate({ body: verifyEmailSchema }), async (req, res) => {
    const used = await consumeAuthToken(req.valid.body.token, 'email_verification');
    // The page adds what to do next, which depends on whether someone is logged in
    if (!used) throw new AppError(400, 'This link has expired or has already been used.');

    const [user] = await db
        .update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(and(eq(users.userId, used.userId), isNull(users.emailVerifiedAt)))
        .returning();
    if (user) await logAction(LOG.EMAIL_VERIFIED, user);
    res.json({ data: { emailVerified: true } });
});

authRouter.post(
    '/resend-verification',
    requireAuth,
    arcjetProtect(resendGuard, (req) => ({ userId: String(req.user.userId) })),
    async (req, res) => {
        if (req.user.emailVerifiedAt) throw new AppError(400, 'Your email is already verified');
        // Asked for on purpose, so unlike at sign-up a failed email is reported
        const sent = await sendVerificationEmail(req.user);
        if (!sent) throw new AppError(503, "We couldn't send the email just now. Please try again later.");
        res.status(204).end();
    },
);

// The same reply whether or not the email has an account (decided 2026-10-27).
// The email is sent without waiting for it, so the reply also takes the same
// time either way; a failure still goes to System Logs
authRouter.post(
    '/forgot-password',
    validate({ body: forgotPasswordSchema }),
    arcjetProtect(forgotGuard, (req) => ({ resetEmail: req.valid.body.email })),
    async (req, res) => {
        const [user] = await db.select().from(users).where(eq(users.email, req.valid.body.email));
        if (user) sendPasswordResetEmail(user).catch((err) => console.error('Password reset email failed:', err.message));
        res.status(204).end();
    },
);

// No login needed, like verify-email. Every session ends and the person logs
// in with the new password (decided 2026-10-27), which also proves it works
authRouter.post('/reset-password', validate({ body: resetPasswordSchema }), async (req, res) => {
    const { token, password } = req.valid.body;
    const used = await consumeAuthToken(token, 'password_reset');
    if (!used) throw new AppError(400, 'This link has expired or has already been used.');

    const [current] = await db.select().from(users).where(eq(users.userId, used.userId));
    const [user] = await db
        .update(users)
        // The link reached the inbox, which is what verifying the email proves
        .set({ password: await bcrypt.hash(password, BCRYPT_COST), emailVerifiedAt: current.emailVerifiedAt ?? new Date() })
        .where(eq(users.userId, used.userId))
        .returning();

    await endAllSessions(user.userId);
    clearSessionCookie(res);
    await logAction(LOG.PASSWORD_CHANGED, user, { via: 'reset link' });
    await sendPasswordChangedEmail(user);
    res.status(204).end();
});

// Allowed while suspended (decided 2026-10-27): keeping an account safe isn't
// something a suspension should stop. Every other device is logged out, and
// this one carries on with a new session
authRouter.put(
    '/password',
    requireAuth,
    arcjetProtect(passwordGuard, (req) => ({ userId: String(req.user.userId) })),
    validate({ body: changePasswordSchema }),
    async (req, res) => {
        const { currentPassword, newPassword } = req.valid.body;
        // 400, not 401: the session is fine, and a 401 would read as being logged out
        if (!(await bcrypt.compare(currentPassword, req.user.password))) {
            const message = 'Your current password is incorrect.';
            throw new AppError(400, message, [{ path: 'body.currentPassword', message }]);
        }

        const [user] = await db
            .update(users)
            .set({ password: await bcrypt.hash(newPassword, BCRYPT_COST) })
            .where(eq(users.userId, req.user.userId))
            .returning();

        await endAllSessions(user.userId);
        await startSession(res, user.userId);
        await logAction(LOG.PASSWORD_CHANGED, user, { via: 'settings' });
        await sendPasswordChangedEmail(user);
        res.status(204).end();
    },
);

export default authRouter;
