import { z } from 'zod';

// The same rules and wording as the sign-up and login forms
// (frontend/src/data/authPageData.js), which check first for quick feedback

const email = z
    .string({ error: 'Enter your email address.' })
    .trim()
    .toLowerCase()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter an email address like name@example.com.').max(255));

export const signUpSchema = z.object({
    username: z.string({ error: 'Enter a display name.' }).trim().min(1, 'Enter a display name.').max(50),
    email,
    // bcrypt only reads the first 72 bytes of a password
    password: z
        .string({ error: 'Enter your password.' })
        .min(8, 'This password is too short.')
        .max(72, 'Use 72 characters or fewer.'),
    // Never 'admin': admins come from the seed script
    role: z.enum(['user', 'organiser'], { error: 'Choose an account type.' }),
});

export const loginSchema = z.object({
    email,
    password: z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.'),
});

export const verifyEmailSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, 'This link is not valid.'),
});
