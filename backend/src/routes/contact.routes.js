import { Router } from "express";
import { slidingWindow, validateEmail } from '@arcjet/node';
import { and, desc, eq, getTableColumns, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { aj } from '../config/arcjet.js';
import { db } from '../db/index.js';
import { contactMessages, users } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import { sendContactReply } from '../lib/contactEmails.js';
import { AppError } from '../lib/errors.js';
import { logAction } from '../lib/systemLogs.js';
import { optionalAuth, readAs, writeAs } from '../middleware/auth.js';
import { arcjetProtect } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { guestMessageSchema, memberMessageSchema, messageIdParams, readSchema, replySchema } from '../validation/contact.js';

const contactRouter = Router();

// 5 messages an hour per IP, and the address must be able to receive the
// reply (decided 2026-11-03). Made once here (null in tests)
const sendGuard = aj
    ?.withRule(slidingWindow({ mode: 'LIVE', interval: '1h', max: 5 }))
    .withRule(validateEmail({ mode: 'LIVE', deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'] }));

// The form's fields depend on who sends it, so the schema is picked once
// optionalAuth has run
const validateMessage = (req, res, next) =>
    validate({ body: req.user ? memberMessageSchema : guestMessageSchema })(req, res, next);

// Matches save_contact_message(): anyone may write, guests included. A
// suspended account may too, since this is how they ask about the suspension
// (decided 2026-11-03)
contactRouter.post(
    '/',
    optionalAuth,
    validateMessage,
    arcjetProtect(sendGuard, (req) => ({ email: req.user?.email ?? req.valid.body.email })),
    async (req, res) => {
        if (req.user?.role === 'admin') throw new AppError(403, "Admin accounts can't send contact messages.");
        const { website, message } = req.valid.body;
        // A bot filled in the hidden field: it is told the message went, so it
        // has nothing to learn from, and nothing is kept
        if (website) return res.status(201).json({ data: { messageId: null, createdAt: new Date() } });

        // Signed in, the name and email are the account's, never the form's
        const sender = req.user
            ? { userId: req.user.userId, name: req.user.username, email: req.user.email }
            : { userId: null, name: req.valid.body.name, email: req.valid.body.email };
        const [row] = await db
            .insert(contactMessages)
            .values({ ...sender, message })
            .returning({ messageId: contactMessages.messageId, createdAt: contactMessages.createdAt });
        res.status(201).json({ data: row });
    },
);

const repliers = alias(users, 'repliers');

// Every message with the replying admin's name, newest first. All at once:
// Contact Messages filters in the browser, like Manage Events and Users
async function listMessages(messageId = null) {
    return db
        .select({ ...getTableColumns(contactMessages), repliedByName: repliers.username })
        .from(contactMessages)
        .leftJoin(repliers, eq(repliers.userId, contactMessages.repliedBy))
        .where(messageId === null ? undefined : eq(contactMessages.messageId, messageId))
        .orderBy(desc(contactMessages.createdAt), desc(contactMessages.messageId));
}

async function findMessage(messageId) {
    const [row] = await listMessages(messageId);
    if (!row) throw new AppError(404, 'Message not found.');
    return row;
}

contactRouter.get('/', ...readAs('admin'), async (req, res) => {
    res.json({ data: await listMessages() });
});

// Opening a message reads it; Mark as unread clears that. The first time it
// was read is kept
contactRouter.put(
    '/:id/read',
    ...writeAs('admin'),
    validate({ params: messageIdParams, body: readSchema }),
    async (req, res) => {
        const message = await findMessage(req.valid.params.id);
        const readAt = req.valid.body.read ? (message.readAt ?? new Date()) : null;
        if (readAt !== message.readAt) {
            await db.update(contactMessages).set({ readAt }).where(eq(contactMessages.messageId, message.messageId));
        }
        res.json({ data: await findMessage(message.messageId) });
    },
);

// One reply per message, emailed to the sender (decided 2026-11-03). The
// message is claimed first, so two admins can't both send one; if the email
// fails the claim is undone, so Replied never shows for a reply nobody got
contactRouter.put(
    '/:id/reply',
    ...writeAs('admin'),
    validate({ params: messageIdParams, body: replySchema }),
    async (req, res) => {
        const message = await findMessage(req.valid.params.id);
        const { reply } = req.valid.body;
        const now = new Date();
        const [claimed] = await db
            .update(contactMessages)
            .set({ replyBody: reply, repliedAt: now, repliedBy: req.user.userId, readAt: message.readAt ?? now })
            .where(and(eq(contactMessages.messageId, message.messageId), isNull(contactMessages.repliedAt)))
            .returning({ messageId: contactMessages.messageId });
        // The only check: one already answered, or answered by another admin
        // a moment ago, isn't claimed
        if (!claimed) throw new AppError(409, 'This message has already been answered.');

        try {
            await sendContactReply(message, reply);
        } catch (err) {
            console.error('Email (contact reply) failed:', err.message);
            await db
                .update(contactMessages)
                .set({ replyBody: null, repliedAt: null, repliedBy: null, readAt: message.readAt })
                .where(eq(contactMessages.messageId, message.messageId));
            await logAction(LOG.EMAIL_FAILED, req.user, { email: 'contact reply', error: err.message });
            throw new AppError(503, "The reply couldn't be sent. Please try again.");
        }

        await logAction(LOG.CONTACT_MESSAGE_REPLIED, req.user, { messageId: message.messageId, name: message.name });
        res.json({ data: await findMessage(message.messageId) });
    },
);

export default contactRouter;
