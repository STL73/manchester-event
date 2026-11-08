import { Router } from "express";
import { slidingWindow, validateEmail } from '@arcjet/node';

import { aj } from '../config/arcjet.js';
import { LOG } from '../constants/logActions.js';
import { findMessage, listMessages, replyToMessage, saveMessage, setRead } from '../lib/contactMessages.js';
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
        const { website } = req.valid.body;
        // A bot filled in the hidden field: it is told the message went, so it
        // has nothing to learn from, and nothing is kept
        if (website) return res.status(201).json({ data: { messageId: null, createdAt: new Date() } });

        const row = await saveMessage(req.user, req.valid.body);
        res.status(201).json({ data: row });
    },
);

// Contact Messages: every message, newest first
contactRouter.get('/', ...readAs('admin'), async (req, res) => {
    res.json({ data: await listMessages() });
});

// Opening a message reads it; Mark as unread clears that
contactRouter.put(
    '/:id/read',
    ...writeAs('admin'),
    validate({ params: messageIdParams, body: readSchema }),
    async (req, res) => {
        const message = await findMessage(req.valid.params.id);
        await setRead(message, req.valid.body.read);
        res.json({ data: await findMessage(message.messageId) });
    },
);

// The reply is emailed at once; one per message (replyToMessage)
contactRouter.put(
    '/:id/reply',
    ...writeAs('admin'),
    validate({ params: messageIdParams, body: replySchema }),
    async (req, res) => {
        const message = await findMessage(req.valid.params.id);
        await replyToMessage(message, req.valid.body.reply, req.user);
        await logAction(LOG.CONTACT_MESSAGE_REPLIED, req.user, { messageId: message.messageId, name: message.name });
        res.json({ data: await findMessage(message.messageId) });
    },
);

export default contactRouter;
