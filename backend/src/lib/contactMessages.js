import { and, desc, eq, getTableColumns, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import { contactMessages, users } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import { sendContactReply } from './contactEmails.js';
import { AppError } from './errors.js';
import { logAction } from './systemLogs.js';

// Saves a Contact message. Signed in, the name and email are the account's,
// never the form's
export async function saveMessage(user, { name, email, message }) {
    const sender = user
        ? { userId: user.userId, name: user.username, email: user.email }
        : { userId: null, name, email };
    const [row] = await db
        .insert(contactMessages)
        .values({ ...sender, message })
        .returning({ messageId: contactMessages.messageId, createdAt: contactMessages.createdAt });
    return row;
}

const repliers = alias(users, 'repliers');

// Every message with the replying admin's name, newest first. All at once:
// Contact Messages filters in the browser, like Manage Events and Users
export async function listMessages(messageId = null) {
    return db
        .select({ ...getTableColumns(contactMessages), repliedByName: repliers.username })
        .from(contactMessages)
        .leftJoin(repliers, eq(repliers.userId, contactMessages.repliedBy))
        .where(messageId === null ? undefined : eq(contactMessages.messageId, messageId))
        .orderBy(desc(contactMessages.createdAt), desc(contactMessages.messageId));
}

// One message by id, or 404
export async function findMessage(messageId) {
    const [row] = await listMessages(messageId);
    if (!row) throw new AppError(404, 'Message not found.');
    return row;
}

// Marks a message read or unread, keeping the first time it was read
export async function setRead(message, read) {
    const readAt = read ? (message.readAt ?? new Date()) : null;
    if (readAt === message.readAt) return;
    await db.update(contactMessages).set({ readAt }).where(eq(contactMessages.messageId, message.messageId));
}

// Emails one reply to the sender. The message is claimed first, so two admins
// can't both reply, and the claim is undone if the email fails
export async function replyToMessage(message, reply, admin) {
    const now = new Date();
    const [claimed] = await db
        .update(contactMessages)
        .set({ replyBody: reply, repliedAt: now, repliedBy: admin.userId, readAt: message.readAt ?? now })
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
        await logAction(LOG.EMAIL_FAILED, admin, { email: 'contact reply', error: err.message });
        throw new AppError(503, "The reply couldn't be sent. Please try again.");
    }
}
