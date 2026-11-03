// The fixed names in notifications.type (decided 2026-10-05). The frontend's
// data/notificationsData.js gives each one its label and icon, so a new name
// needs an entry there too. account_status arrives with suspension (Phase 8),
// the two reminders with the scheduled jobs (Phase 11)
export const NOTIFY = {
    CATEGORY_NEW_EVENT: 'category_new_event',
    EVENT_UPDATE: 'event_update',
    EVENT_CANCELLED: 'event_cancelled',
    EVENT_STATUS: 'event_status',
    PASSWORD_CHANGED: 'password_changed',
    USER_REGISTERED: 'user_registered',
    EVENT_CANCELLED_BY_ORGANISER: 'event_cancelled_by_organiser',
    EVENT_PENDING_REVIEW: 'event_pending_review',
};
