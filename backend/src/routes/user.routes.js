import { Router } from "express";
import { and, eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users, favourites } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import {
    deleteAccount,
    findManagedAccount,
    listManagedUsers,
    publicUser,
    reactivateAccount,
    suspendAccount,
} from '../lib/accounts.js';
import { AppError, fieldError } from '../lib/errors.js';
import { deleteImage } from '../lib/images.js';
import { listFollows, replaceFollows } from '../lib/follows.js';
import { formatUntil } from '../lib/londonTime.js';
import { listNotifications, markRead, messages, notifyUser } from '../lib/notifications.js';
import { listOrganiserEvents } from '../lib/organiserEvents.js';
import { canSaveEvent, listFavouriteEvents } from '../lib/publicEvents.js';
import { checkPassword } from '../lib/passwords.js';
import { clearSessionCookie } from '../lib/sessions.js';
import { logAction } from '../lib/systemLogs.js';
import { withUpload } from '../lib/uploads.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireActive, readAs, writeAs } from '../middleware/auth.js';
import { acceptImage } from '../middleware/upload.js';
import { eventIdParams } from '../validation/events.js';
import {
    accountStatusSchema,
    deleteAccountSchema,
    followsSchema,
    markReadSchema,
    updateProfileSchema,
    userIdParams,
} from '../validation/users.js';

const userRouter = Router();

// /me before /:id, or "me" would be read as an ID.
// A suspended account can't change its name or switch (decided 2026-10-27)
userRouter.put('/me', requireAuth, requireActive, validate({ body: updateProfileSchema }), async (req, res) => {
    const [user] = await db
        .update(users)
        .set(req.valid.body)
        .where(eq(users.userId, req.user.userId))
        .returning();
    await logAction(LOG.PROFILE_UPDATED, user, { fields: Object.keys(req.valid.body) });
    res.json({ data: publicUser(user) });
});

// Settings' profile picture (Phase 6), its own route so PUT /me keeps the
// email switch's rules to itself. Cloudinary crops it square round the subject
async function setAvatar(userId, uploaded) {
    const [user] = await db
        .update(users)
        .set({ avatar: uploaded?.url ?? null, avatarPublicId: uploaded?.publicId ?? null })
        .where(eq(users.userId, userId))
        .returning();
    return user;
}

// Once the account points at its new picture (or none): the old one goes
async function afterAvatarChange(previous, user) {
    if (previous.avatarPublicId !== user.avatarPublicId) await deleteImage(previous.avatarPublicId);
    await logAction(LOG.PROFILE_UPDATED, user, { fields: ['avatar'] });
}

userRouter.put('/me/avatar', requireAuth, requireActive, ...acceptImage('avatar'), async (req, res) => {
    if (!req.file) {
        throw fieldError(400, 'avatar', 'Choose a picture.');
    }
    const user = await withUpload(req.file, 'avatar', (uploaded) => setAvatar(req.user.userId, uploaded));
    await afterAvatarChange(req.user, user);
    res.json({ data: publicUser(user) });
});

userRouter.delete('/me/avatar', requireAuth, requireActive, async (req, res) => {
    const user = await setAvatar(req.user.userId, null);
    await afterAvatarChange(req.user, user);
    res.json({ data: publicUser(user) });
});

// The schema's deletion rule: an organiser whose events have been public can
// only be suspended, since people may have saved those events. Their other
// events go with the account. Admins have no Delete in Settings, and a
// suspension can't be escaped by deleting the account
userRouter.delete(
    '/me',
    ...writeAs('user', 'organiser'),
    validate({ body: deleteAccountSchema }),
    async (req, res) => {
        const { userId, username, role, password } = req.user;
        if (!(await checkPassword(req.valid.body.password, password))) {
            throw fieldError(400, 'password', 'Your password is incorrect.');
        }

        const eventsDeleted = await deleteAccount(
            req.user,
            'Your account has events that have been public, so it can\'t be deleted here. Please contact us.',
        );

        // Logged with no account to link to: the name and role are copied
        await logAction(LOG.ACCOUNT_DELETED, { username, role }, { userId, eventsDeleted });
        clearSessionCookie(res);
        res.status(204).end();
    },
);

// Favourites and follows are the user role's (My Favourites, Preferences).
// Saving and following change something, so a suspended account can only read
// them (decided 2026-10-05: suspended = read-only)

userRouter.get('/me/favourites', ...readAs('user'), async (req, res) => {
    res.json({ data: await listFavouriteEvents(req.user.userId) });
});

// PUT, not POST: saving twice leaves one save. Only what the lists show can be
// saved: an event that has ended, been cancelled or whose organiser is suspended
// can't (decided 2026-10-05 and 2026-10-27), though saves made before are kept
userRouter.put('/me/favourites/:id', ...writeAs('user'), validate({ params: eventIdParams }), async (req, res) => {
    const eventId = req.valid.params.id;
    const saveable = await canSaveEvent(eventId);
    if (saveable === null) throw new AppError(404, 'Event not found.');
    if (!saveable) throw new AppError(400, 'This event can\'t be saved: it has ended, been cancelled or is no longer listed.');

    await db.insert(favourites).values({ userId: req.user.userId, eventId }).onConflictDoNothing();
    res.status(204).end();
});

// Removing always works, so an ended or cancelled favourite can be cleared
userRouter.delete('/me/favourites/:id', ...writeAs('user'), validate({ params: eventIdParams }), async (req, res) => {
    await db
        .delete(favourites)
        .where(and(eq(favourites.userId, req.user.userId), eq(favourites.eventId, req.valid.params.id)));
    res.status(204).end();
});

userRouter.get('/me/follows', ...readAs('user'), async (req, res) => {
    res.json({ data: await listFollows(req.user.userId) });
});

userRouter.put('/me/follows', ...writeAs('user'), validate({ body: followsSchema }), async (req, res) => {
    res.json({ data: await replaceFollows(req.user.userId, req.valid.body.categories) });
});

// My Events, My Drafts and Organiser Home: every one of the organiser's events,
// drafts and past ones included. Reading works while suspended
userRouter.get('/me/events', ...readAs('organiser'), async (req, res) => {
    res.json({ data: await listOrganiserEvents(req.user.userId) });
});

// The inbox (Phase 7), every role's. Reading and marking read work while
// suspended: marking read changes nothing anyone else sees
userRouter.get('/me/notifications', requireAuth, async (req, res) => {
    res.json({ data: await listNotifications(req.user.userId) });
});

userRouter.put('/me/notifications/read', requireAuth, validate({ body: markReadSchema }), async (req, res) => {
    await markRead(req.user.userId, req.valid.body);
    res.status(204).end();
});

// Manage Users (Phase 8). Accounts are made by sign-up and admins by the seed,
// so there's no create; the list carries everything the panel shows. Admin
// accounts aren't changed here, nor your own (decided 2026-11-03)

userRouter.get('/', ...readAs('admin'), async (req, res) => {
    res.json({ data: await listManagedUsers() });
});

// Suspending takes effect on the person's next request (requireActive reads the
// account each time), so their sessions are left alone: they can still sign in
// and read, with the banner (decided 2026-11-03)
userRouter.put(
    '/:id/status',
    ...writeAs('admin'),
    validate({ params: userIdParams, body: accountStatusSchema }),
    async (req, res) => {
        const account = await findManagedAccount(req.user.userId, req.valid.params.id);
        const body = req.valid.body;

        if (body.status === 'active') {
            if (await reactivateAccount(account)) {
                await logAction(LOG.USER_STATUS_CHANGED, req.user, { userId: account.userId, username: account.username, status: 'active' });
                await notifyUser(account.userId, messages.reactivated());
            }
            return res.json({ data: (await listManagedUsers(account.userId))[0] });
        }

        const until = await suspendAccount(account, body);
        await logAction(LOG.USER_STATUS_CHANGED, req.user, {
            userId: account.userId,
            username: account.username,
            status: 'suspended',
            reason: body.reason,
            until: until?.toISOString() ?? null,
        });
        // A changed length or reason is told again, with the new terms
        await notifyUser(account.userId, messages.suspended(until && formatUntil(until), body.reason));
        res.json({ data: (await listManagedUsers(account.userId))[0] });
    },
);

userRouter.delete('/:id', ...writeAs('admin'), validate({ params: userIdParams }), async (req, res) => {
    const account = await findManagedAccount(req.user.userId, req.valid.params.id);
    const eventsDeleted = await deleteAccount(account, 'This account has events that have been public, so it can only be suspended.');
    await logAction(LOG.USER_DELETED, req.user, {
        userId: account.userId,
        username: account.username,
        role: account.role,
        eventsDeleted,
    });
    res.status(204).end();
});

export default userRouter;
