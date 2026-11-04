// The fixed action names in system_logs, the PHP project's log_system_action()
// names. The frontend's lib/systemLogs.js turns each one into a sentence, so a
// new name needs a describer there too
export const LOG = {
    USER_REGISTERED: 'User Registered',
    USER_LOGIN: 'User Login',
    USER_LOGIN_FAILED: 'User Login Failed',
    USER_LOGOUT: 'User Logout',
    EMAIL_VERIFIED: 'Email Verified',
    EMAIL_FAILED: 'Email Failed',
    PASSWORD_CHANGED: 'Password Changed',
    PROFILE_UPDATED: 'Profile Updated',
    ACCOUNT_DELETED: 'Account Deleted',
    // details: { eventId, name } (+ status on Created)
    EVENT_CREATED: 'Event Created',
    EVENT_UPDATED: 'Event Updated',
    DRAFT_SUBMITTED: 'Draft Submitted',
    EVENT_CANCELLED: 'Event Cancelled',
    EVENT_DELETED: 'Event Deleted',
    // An admin's decision: { eventId, name, status, reason? } (Phase 7)
    EVENT_STATUS_CHANGED: 'Event Status Changed',
    // An admin managing an account (Phase 8): { userId, username, status,
    // reason?, until? } and { userId, username, role, eventsDeleted }
    USER_STATUS_CHANGED: 'User Status Changed',
    USER_DELETED: 'User Deleted',
    // An admin's reply to a Contact form message (Phase 9): { messageId, name }
    CONTACT_MESSAGE_REPLIED: 'Contact Message Replied',
};

// System Logs' pills (Phase 10). They match the `kind` the frontend's
// describers give each action: Sign-ins includes the failed ones, and
// Accounts is every action in neither list, so a new name lands there as
// it does on the page. Admins only is the copied role, not an action.
// admin-actions isn't a pill: Admin Home's Recent Admin Actions, an admin's
// rows without their sign-ins and sign-outs (Slav, 2026-11-04)
export const LOG_EVENT_ACTIONS = [
    LOG.EVENT_CREATED,
    LOG.EVENT_UPDATED,
    LOG.DRAFT_SUBMITTED,
    LOG.EVENT_CANCELLED,
    LOG.EVENT_DELETED,
    LOG.EVENT_STATUS_CHANGED,
];
export const LOG_SIGN_IN_ACTIONS = [LOG.USER_LOGIN, LOG.USER_LOGOUT, LOG.USER_LOGIN_FAILED];
export const LOG_VIEWS = ['all', 'events', 'accounts', 'signins', 'failed', 'admin', 'admin-actions'];
