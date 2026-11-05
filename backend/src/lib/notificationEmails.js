import { APP_URL } from '../config/env.js';
import { ALWAYS_EMAILED_TYPES } from '../constants/notificationTypes.js';
import { escapeHtml } from './html.js';

// A notification as an email (Phase 11): the inbox row's subject and body, a
// link and, unless it's a security email, how to turn them off. The link opens
// the dashboard's Event details, which shows each role its own view of the
// event (an organiser's draft, an admin's pending one), or Notifications when
// the row has no event. Both ask a signed-out reader to log in first
export function notificationEmail(row) {
    const link = row.eventId
        ? { url: `${APP_URL}/dashboard/events/${row.eventId}`, label: 'View the event' }
        : { url: `${APP_URL}/dashboard/notifications`, label: 'Open your notifications' };
    const security = ALWAYS_EMAILED_TYPES.includes(row.type);
    const settings = `${APP_URL}/dashboard/settings`;
    const footer = security
        ? 'This is about your account, so it is sent even when email notifications are off.'
        : 'You get these emails because email notifications are on.';

    return {
        to: row.email,
        subject: row.subject,
        text: [
            `Hi ${row.username},`,
            row.body,
            `${link.label}: ${link.url}`,
            security ? footer : `${footer} You can turn them off in Settings: ${settings}`,
        ].join('\n\n'),
        html: `<p>Hi ${escapeHtml(row.username)},</p>
<p>${escapeHtml(row.body)}</p>
<p><a href="${link.url}">${link.label}</a></p>
<p style="color:#666">${footer}${security ? '' : ` You can turn them off in <a href="${settings}">Settings</a>.`}</p>`,
    };
}
