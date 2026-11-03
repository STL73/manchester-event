import { z } from 'zod';
import { email } from './auth.js';

const message = z
    .string({ error: 'Write your message.' })
    .trim()
    .min(1, 'Write your message.')
    .max(5000, 'Keep your message under 5,000 characters.');

// A field people never see (Contact.jsx hides it). Bots fill in every field,
// so a value here means the message is dropped
const website = z.string().optional();

// A signed-in sender's name and email come from the account, so only the
// message is read; anything else sent is left out
export const memberMessageSchema = z.object({ message, website });

export const guestMessageSchema = z.object({
    name: z.string({ error: 'Enter your name.' }).trim().min(1, 'Enter your name.').max(50, 'Use 50 characters or fewer.'),
    email,
    message,
    website,
});

export const messageIdParams = z.object({ id: z.coerce.number({ error: 'Message not found.' }).int().positive() });

export const readSchema = z.object({ read: z.boolean({ error: 'Choose read or unread.' }) });

export const replySchema = z.object({
    reply: z
        .string({ error: 'Write a reply first.' })
        .trim()
        .min(1, 'Write a reply first.')
        .max(5000, 'Keep the reply under 5,000 characters.'),
});
