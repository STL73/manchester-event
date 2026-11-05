// The fixed names in notifications.type (decided 2026-10-05). The frontend's
// data/notificationsData.js gives each one its label and icon, so a new name
// needs an entry there too. The two reminders came with the scheduled jobs
// (Phase 11)
export const NOTIFY = {
    EVENT_REMINDER_WEEK: 'event_reminder_week',
    EVENT_REMINDER_DAY: 'event_reminder_day',
    CATEGORY_NEW_EVENT: 'category_new_event',
    EVENT_UPDATE: 'event_update',
    EVENT_CANCELLED: 'event_cancelled',
    EVENT_STATUS: 'event_status',
    PASSWORD_CHANGED: 'password_changed',
    USER_REGISTERED: 'user_registered',
    EVENT_CANCELLED_BY_ORGANISER: 'event_cancelled_by_organiser',
    EVENT_PENDING_REVIEW: 'event_pending_review',
    ACCOUNT_STATUS: 'account_status',
};

// Which rows the email job sends (Slav, 2026-11-05): all but a sign-up alert,
// which would come with every sign-up, and the password change, which has its
// own email (authEmails.js). Only to verified addresses
export const EMAILED_TYPES = Object.values(NOTIFY).filter(
    (type) => type !== NOTIFY.USER_REGISTERED && type !== NOTIFY.PASSWORD_CHANGED,
);

// Security emails: sent even with email notifications off in Settings
export const ALWAYS_EMAILED_TYPES = [NOTIFY.ACCOUNT_STATUS];
