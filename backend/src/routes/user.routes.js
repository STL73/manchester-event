import { Router } from "express";
import bcrypt from 'bcryptjs';
import { and, eq, inArray, isNotNull, not, or } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users, events } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import { AppError } from '../lib/errors.js';
import { clearSessionCookie } from '../lib/sessions.js';
import { logAction } from '../lib/systemLogs.js';
import { publicUser } from '../lib/users.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireActive, requireRole } from '../middleware/auth.js';
import { updateProfileSchema, deleteAccountSchema } from '../validation/users.js';

const userRouter = Router();

// An event has been public once it was approved: it is approved or cancelled
// now, or an edit of it is waiting with its approved version kept
const hasBeenPublic = or(inArray(events.status, ['approved', 'cancelled']), isNotNull(events.approvedSnapshot));

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
                .returning({ eventId: events.eventId }),
            db.delete(users).where(eq(users.userId, userId)),
        ]);

        // Logged with no account to link to: the name and role are copied
        await logAction(LOG.ACCOUNT_DELETED, { username, role }, { userId, eventsDeleted: deletedEvents.length });
        clearSessionCookie(res);
        res.status(204).end();
    },
);

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
