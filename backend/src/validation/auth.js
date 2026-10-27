import { z } from 'zod';

// The same rules and wording as the sign-up and login forms
// (frontend/src/data/authPageData.js), which check first for quick feedback

const email = z
    .string({ error: 'Enter your email address.' })
    .trim()
    .toLowerCase()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter an email address like name@example.com.').max(255));

// bcrypt only reads the first 72 bytes of a password
export const newPassword = z
    .string({ error: 'Enter your password.' })
    .min(8, 'This password is too short.')
    .max(72, 'Use 72 characters or fewer.');

export const username = z.string({ error: 'Enter a display name.' }).trim().min(1, 'Enter a display name.').max(50);

// A password typed to prove who you are: checked against the hash, never against the rules
export const currentPassword = z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.');

const linkToken = z.string().regex(/^[a-f0-9]{64}$/, 'This link is not valid.');

export const signUpSchema = z.object({
    username,
    email,
    password: newPassword,
    // Never 'admin': admins come from the seed script
    role: z.enum(['user', 'organiser'], { error: 'Choose an account type.' }),
});

export const loginSchema = z.object({
    email,
    password: currentPassword,
});

export const verifyEmailSchema = z.object({
    token: linkToken,
});

export const forgotPasswordSchema = z.object({
    email,
});

export const resetPasswordSchema = z.object({
    token: linkToken,
    password: newPassword,
});

export const changePasswordSchema = z.object({
    currentPassword,
    newPassword,
});
