import { APP_URL } from '../config/env.js';
import { LOG } from '../constants/logActions.js';
import { createAuthToken } from './authTokens.js';
import { sendEmail } from './email.js';
import { logAction } from './systemLogs.js';

// The display name is typed by the user, so it's escaped before going into HTML
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function verificationEmail(username, link) {
    return {
        subject: 'Confirm your email for Manchester Event Portal',
        text: [
            `Hi ${username},`,
            'Please confirm your email address by opening this link:',
            link,
            'The link works for 24 hours. If you didn\'t create an account, you can ignore this email.',
        ].join('\n\n'),
        html: `<p>Hi ${escapeHtml(username)},</p>
<p>Please confirm your email address:</p>
<p><a href="${link}">Confirm my email</a></p>
<p>The link works for 24 hours. If you didn't create an account, you can ignore this email.</p>`,
    };
}

function passwordResetEmail(username, link) {
    return {
        subject: 'Reset your Manchester Event Portal password',
        text: [
            `Hi ${username},`,
            'Someone asked to reset the password for your account. To choose a new one, open this link:',
            link,
            "The link works for 1 hour. If it wasn't you, ignore this email: your password stays as it is.",
        ].join('\n\n'),
        html: `<p>Hi ${escapeHtml(username)},</p>
<p>Someone asked to reset the password for your account.</p>
<p><a href="${link}">Choose a new password</a></p>
<p>The link works for 1 hour. If it wasn't you, ignore this email: your password stays as it is.</p>`,
    };
}

// A security email: sent even when the account has email notifications off
function passwordChangedEmail(username, resetLink) {
    return {
        subject: 'Your Manchester Event Portal password was changed',
        text: [
            `Hi ${username},`,
            'The password for your account was just changed, and every other device was logged out.',
            `If this wasn't you, reset your password straight away: ${resetLink}`,
        ].join('\n\n'),
        html: `<p>Hi ${escapeHtml(username)},</p>
<p>The password for your account was just changed, and every other device was logged out.</p>
<p>If this wasn't you, <a href="${resetLink}">reset your password</a> straight away.</p>`,
    };
}

// Returns false if the email couldn't be sent; the failure goes to System
// Logs, with `kind` saying which email it was
async function send(user, kind, email) {
    try {
        await sendEmail({ to: user.email, ...email });
        return true;
    } catch (err) {
        console.error(`Email (${kind}) failed:`, err.message);
        await logAction(LOG.EMAIL_FAILED, user, { email: kind, error: err.message });
        return false;
    }
}

// The links open the frontend, which sends the token with a POST. A GET to the
// API would let email scanners, which open every link, use it up first
export async function sendVerificationEmail(user) {
    const token = await createAuthToken(user.userId, 'email_verification');
    return send(user, 'verification', verificationEmail(user.username, `${APP_URL}/auth/verify-email?token=${token}`));
}

export async function sendPasswordResetEmail(user) {
    const token = await createAuthToken(user.userId, 'password_reset');
    return send(user, 'password_reset', passwordResetEmail(user.username, `${APP_URL}/auth/reset-password?token=${token}`));
}

export async function sendPasswordChangedEmail(user) {
    return send(user, 'password_changed', passwordChangedEmail(user.username, `${APP_URL}/auth/forgot-password`));
}
