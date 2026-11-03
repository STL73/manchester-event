import { Router } from "express";
import bcrypt from 'bcryptjs';
import { and, asc, eq, inArray, not, notInArray } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users, events, favourites, categories, categoryFollows } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import { AppError } from '../lib/errors.js';
import { deleteImage } from '../lib/images.js';
import { listNotifications, markRead } from '../lib/notifications.js';
import { listOrganiserEvents } from '../lib/organiserEvents.js';
import { canSaveEvent, hasBeenPublic, listFavouriteEvents } from '../lib/publicEvents.js';
import { clearSessionCookie } from '../lib/sessions.js';
import { logAction } from '../lib/systemLogs.js';
import { withUpload } from '../lib/uploads.js';
import { publicUser } from '../lib/users.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireActive, requireRole } from '../middleware/auth.js';
import { acceptImage } from '../middleware/upload.js';
import { eventIdParams } from '../validation/events.js';
import { updateProfileSchema, deleteAccountSchema, followsSchema, markReadSchema } from '../validation/users.js';

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
        const message = 'Choose a picture.';
        throw new AppError(400, message, [{ path: 'body.avatar', message }]);
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
    requireAuth,
    requireActive,
    requireRole('user', 'organiser'),
    validate({ body: deleteAccountSchema }),
    async (req, res) => {
        const { userId, username, role, password } = req.user;
        if (!(await bcrypt.compare(req.valid.body.password, password))) {
            const message = 'Your password is incorrect.';
            throw new AppError(400, message, [{ path: 'body.password', message }]);
        }

        const [publicEvent] = await db
            .select({ eventId: events.eventId })
            .from(events)
            .where(and(eq(events.organiserId, userId), hasBeenPublic))
            .limit(1);
        if (publicEvent) {
            throw new AppError(409, 'Your account has events that have been public, so it can\'t be deleted here. Please contact us.');
        }

        // One batch runs as one transaction. If an event went public since the
        // check, events.organiser_id's RESTRICT stops the user delete and the
        // whole batch is undone. Sessions, tokens, favourites and follows cascade
        const [deletedEvents] = await db.batch([
            db.delete(events)
                .where(and(eq(events.organiserId, userId), not(hasBeenPublic)))
                .returning({ eventId: events.eventId, imagePublicId: events.imagePublicId }),
            db.delete(users).where(eq(users.userId, userId)),
        ]);
        // Their pictures go too, once the account is gone (none were ever public)
        await Promise.all([req.user.avatarPublicId, ...deletedEvents.map((event) => event.imagePublicId)].map(deleteImage));

        // Logged with no account to link to: the name and role are copied
        await logAction(LOG.ACCOUNT_DELETED, { username, role }, { userId, eventsDeleted: deletedEvents.length });
        clearSessionCookie(res);
        res.status(204).end();
    },
);

// Favourites and follows are the user role's (My Favourites, Preferences).
// Saving and following change something, so a suspended account can only read
// them (decided 2026-10-05: suspended = read-only)
const asUser = [requireAuth, requireRole('user')];
const asActiveUser = [requireAuth, requireActive, requireRole('user')];

userRouter.get('/me/favourites', ...asUser, async (req, res) => {
    res.json({ data: await listFavouriteEvents(req.user.userId) });
});

// PUT, not POST: saving twice leaves one save. Only what the lists show can be
// saved: an event that has ended, been cancelled or whose organiser is suspended
// can't (decided 2026-10-05 and 2026-10-27), though saves made before are kept
userRouter.put('/me/favourites/:id', ...asActiveUser, validate({ params: eventIdParams }), async (req, res) => {
    const eventId = req.valid.params.id;
    const saveable = await canSaveEvent(eventId);
    if (saveable === null) throw new AppError(404, 'Event not found.');
    if (!saveable) throw new AppError(400, 'This event can\'t be saved: it has ended, been cancelled or is no longer listed.');

    await db.insert(favourites).values({ userId: req.user.userId, eventId }).onConflictDoNothing();
    res.status(204).end();
});

// Removing always works, so an ended or cancelled favourite can be cleared
userRouter.delete('/me/favourites/:id', ...asActiveUser, validate({ params: eventIdParams }), async (req, res) => {
    await db
        .delete(favourites)
        .where(and(eq(favourites.userId, req.user.userId), eq(favourites.eventId, req.valid.params.id)));
    res.status(204).end();
});

// Archived categories are hidden from Preferences, so they're left out here too
userRouter.get('/me/follows', ...asUser, async (req, res) => {
    const rows = await db
        .select({ slug: categories.slug })
        .from(categoryFollows)
        .innerJoin(categories, eq(categories.categoryId, categoryFollows.categoryId))
        .where(and(eq(categoryFollows.userId, req.user.userId), eq(categories.isActive, true)))
        .orderBy(asc(categories.slug));
    res.json({ data: rows.map((row) => row.slug) });
});

// The picks replace the active categories followed. Follows of an archived
// category stay: the honeycomb doesn't show it, so leaving it out isn't a choice
userRouter.put('/me/follows', ...asActiveUser, validate({ body: followsSchema }), async (req, res) => {
    const { userId } = req.user;
    const slugs = req.valid.body.categories;
    const picked = slugs.length
        ? await db
            .select({ categoryId: categories.categoryId, slug: categories.slug })
            .from(categories)
            .where(and(inArray(categories.slug, slugs), eq(categories.isActive, true)))
        : [];
    if (picked.length !== slugs.length) {
        const message = 'Choose categories from the list.';
        throw new AppError(400, message, [{ path: 'body.categories', message }]);
    }

    const pickedIds = picked.map((category) => category.categoryId);
    const active = db.select({ categoryId: categories.categoryId }).from(categories).where(eq(categories.isActive, true));
    const dropped = and(
        eq(categoryFollows.userId, userId),
        inArray(categoryFollows.categoryId, active),
        ...(pickedIds.length ? [notInArray(categoryFollows.categoryId, pickedIds)] : []),
    );
    // One batch, one transaction: the follows never sit half replaced
    await db.batch([
        db.delete(categoryFollows).where(dropped),
        ...(pickedIds.length
            ? [db.insert(categoryFollows).values(pickedIds.map((categoryId) => ({ userId, categoryId }))).onConflictDoNothing()]
            : []),
    ]);
    res.json({ data: picked.map((category) => category.slug).sort() });
});

// My Events, My Drafts and Organiser Home: every one of the organiser's events,
// drafts and past ones included. Reading works while suspended
userRouter.get('/me/events', requireAuth, requireRole('organiser'), async (req, res) => {
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

userRouter.get('/', (req, res) => {
    res.send('Get all users')
})

userRouter.get('/:id', (req, res) => {
    res.send('Get user details')
})

userRouter.post('/', (req, res) => {
    res.send('Create new user')
})

userRouter.put('/:id', (req, res) => {
    res.send('Update user')
})

userRouter.delete('/:id', (req, res) => {
    res.send('Delete user')
})

export default userRouter;
