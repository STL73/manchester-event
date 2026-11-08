import { z } from 'zod';
import { username, currentPassword } from './auth.js';
import { SLUG, idParams } from './common.js';

// Each Settings section saves on its own, so either field may come alone
export const updateProfileSchema = z
    .object({
        username: username.optional(),
        emailNotifications: z.boolean({ error: 'Choose on or off.' }).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'Nothing to change.');

export const deleteAccountSchema = z.object({
    password: currentPassword,
});

// Preferences saves every pick at once: the whole list replaces what was followed
export const followsSchema = z.object({
    categories: z
        .array(z.string().regex(SLUG, 'Choose categories from the list.'), { error: 'Choose categories from the list.' })
        .max(50)
        .transform((slugs) => [...new Set(slugs)]),
});

export const userIdParams = idParams('Account not found.');

// Manage Users (Phase 8): Active, or Suspended for 7 or 30 days or until lifted
// (null), with a reason the person reads. Leaving days out keeps the current end
// of a suspension already in place (the panel's "Keep")
export const accountStatusSchema = z.discriminatedUnion(
    'status',
    [
        z.object({ status: z.literal('active') }),
        z.object({
            status: z.literal('suspended'),
            reason: z
                .string({ error: 'Say why, so they know what to change.' })
                .trim()
                .min(1, 'Say why, so they know what to change.')
                .max(1000, 'Keep the reason under 1,000 characters.'),
            days: z.union([z.literal(7), z.literal(30), z.null()], { error: 'Choose how long.' }).optional(),
        }),
    ],
    { error: 'Choose Active or Suspended.' },
);

// Opening a notification marks it read; Mark All as Read sends all: true
export const markReadSchema = z
    .object({
        ids: z.array(z.number().int().positive(), { error: 'Choose notifications to mark.' }).min(1).max(200).optional(),
        all: z.literal(true).optional(),
    })
    .refine((body) => Boolean(body.ids) !== Boolean(body.all), 'Send either ids or all.');
