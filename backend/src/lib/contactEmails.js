import { sendEmail } from './email.js';

// Everything here was typed by the sender or the admin, so it's escaped
// before going into HTML, and line breaks are kept
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
const paragraphs = (value) => escapeHtml(value).replace(/\n/g, '<br>');

// The admin's reply to a Contact form message, with the message quoted under
// it. Always sent: it's the answer they asked for, not a notification
export async function sendContactReply(message, reply) {
    const sent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', dateStyle: 'long' }).format(message.createdAt);
    await sendEmail({
        to: message.email,
        subject: 'Re: your message to Manchester Event Portal',
        text: [
            `Hi ${message.name},`,
            reply,
            'Manchester Event Portal',
            `On ${sent} you wrote:`,
            message.message.split('\n').map((line) => `> ${line}`).join('\n'),
        ].join('\n\n'),
        html: `<p>Hi ${escapeHtml(message.name)},</p>
<p>${paragraphs(reply)}</p>
<p>Manchester Event Portal</p>
<p style="color:#666">On ${sent} you wrote:</p>
<blockquote style="margin:0;padding-left:12px;border-left:3px solid #ccc;color:#666">${paragraphs(message.message)}</blockquote>`,
    });
}
