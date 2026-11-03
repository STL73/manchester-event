import { z } from 'zod';
import { username, currentPassword } from './auth.js';

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
        .array(z.string().regex(/^[a-z0-9-]+$/, 'Choose categories from the list.'), { error: 'Choose categories from the list.' })
        .max(50)
        .transform((slugs) => [...new Set(slugs)]),
});

// Opening a notification marks it read; Mark All as Read sends all: true
export const markReadSchema = z
    .object({
        ids: z.array(z.number().int().positive(), { error: 'Choose notifications to mark.' }).min(1).max(200).optional(),
        all: z.literal(true).optional(),
    })
    .refine((body) => Boolean(body.ids) !== Boolean(body.all), 'Send either ids or all.');
