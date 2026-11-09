// The fixed names in notifications.type. The frontend's notificationsData.js
// gives each its label and icon, so a new name needs an entry there too
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

// The types the email job sends: all but the sign-up alert, which would come
// with every sign-up, and the password change, which has its own email
export const EMAILED_TYPES = Object.values(NOTIFY).filter(
    (type) => type !== NOTIFY.USER_REGISTERED && type !== NOTIFY.PASSWORD_CHANGED,
);

// Security emails: sent even with email notifications off in Settings
export const ALWAYS_EMAILED_TYPES = [NOTIFY.ACCOUNT_STATUS];
