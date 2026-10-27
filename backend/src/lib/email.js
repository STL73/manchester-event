import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_FROM_NAME, NODE_ENV } from '../config/env.js';

// Every email the app sends goes through sendEmail(), so changing provider
// (Resend, once the site has its own domain) means changing only this file.
// Gmail with an app password allows about 500 emails a day
const configured = Boolean(EMAIL_USER && EMAIL_APP_PASSWORD);

if (!configured && NODE_ENV === 'production') {
    throw new Error('EMAIL_USER and EMAIL_APP_PASSWORD must be set in production');
}

const transporter = configured
    ? nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD } })
    : null;

export async function sendEmail({ to, subject, text, html }) {
    // Locally without credentials the email is printed instead, so its link
    // can still be opened from the server's terminal
    if (!transporter) {
        console.info(`\n[Email not sent: EMAIL_USER is not set]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
        return;
    }
    await transporter.sendMail({ from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`, to, subject, text, html });
}
