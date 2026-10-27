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

// The link opens the frontend, which sends the token with a POST. A GET to the
// API would let email scanners, which open every link, use it up first.
// Returns false if the email couldn't be sent; the failure goes to System Logs
export async function sendVerificationEmail(user) {
    const token = await createAuthToken(user.userId, 'email_verification');
    const link = `${APP_URL}/auth/verify-email?token=${token}`;
    try {
        await sendEmail({ to: user.email, ...verificationEmail(user.username, link) });
        return true;
    } catch (err) {
        console.error('Verification email failed:', err.message);
        await logAction(LOG.EMAIL_FAILED, user, { email: 'verification', error: err.message });
        return false;
    }
}
