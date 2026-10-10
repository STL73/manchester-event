import { Eye, MailOpen } from "lucide-react";

// The line under the page title: "3 unread · newest 27 Sept"
export const notificationsSummary = {
  unread: "unread",
  newest: "newest",
  caughtUp: "You're all caught up",
};

export const notificationActions = {
  markAllRead: { label: "Mark All as Read", icon: MailOpen },
  markRead: { label: "Mark as Read", icon: MailOpen },
  viewEvent: { label: "View Event", icon: Eye },
};

// Readable labels for the notifications.type values
export const notificationTypeLabels = {
  category_new_event: "New event",
  event_update: "Event update",
  event_removed: "Event removed",
  event_reminder: "Reminder",
  event_cancelled: "Event cancelled",
  account_status: "Account status",
  password_changed: "Password changed",
  event_status: "Event status",
  user_registered: "New user",
  system_error: "System error",
  event_cancelled_by_organiser: "Cancelled by organiser",
};

// Mock of the notifications table; recipient is the role it was sent to
const notifications = [
  {
    notificationId: 1,
    recipient: "user",
    eventId: 1,
    type: "event_reminder",
    subject: "Upcoming Favourite Event",
    body: 'Your favourite event "Manchester Live Sessions" is happening soon!',
    scheduledAt: "2026-09-27T09:00:00",
    isRead: false,
  },
  {
    notificationId: 2,
    recipient: "user",
    eventId: 4,
    type: "category_new_event",
    subject: "New Event: Live at MediaCity",
    body: 'A new event "Live at MediaCity" was added to your preferred category.',
    scheduledAt: "2026-09-26T10:15:00",
    isRead: false,
  },
  {
    notificationId: 3,
    recipient: "user",
    eventId: 3,
    type: "event_update",
    subject: "Favourite Event Update: Manchester Community Day",
    body: 'An event "Manchester Community Day" you followed has been updated. Check out the latest details.',
    scheduledAt: "2026-09-24T16:40:00",
    isRead: false,
  },
  {
    notificationId: 4,
    recipient: "user",
    eventId: 5,
    type: "event_cancelled",
    subject: "Event Cancelled: Manchester Active Weekend",
    body: 'The event "Manchester Active Weekend" you follow has been cancelled.',
    scheduledAt: "2026-09-20T09:05:00",
    isRead: true,
  },
  {
    notificationId: 5,
    recipient: "user",
    eventId: null,
    type: "password_changed",
    subject: "Password Changed",
    body: "Hello userName, your account password was changed. If this was not you, please contact support immediately.",
    scheduledAt: "2026-09-15T21:12:00",
    isRead: true,
  },
  {
    notificationId: 6,
    recipient: "organiser",
    eventId: 2,
    type: "event_status",
    subject: "Your Event Status Updated",
    body: 'Your event "Northern Art After Dark" has been approved by the admin.',
    scheduledAt: "2026-09-25T11:30:00",
    isRead: false,
  },
  {
    notificationId: 7,
    recipient: "organiser",
    eventId: 5,
    type: "event_status",
    subject: "Your Event Status Updated",
    body: 'Your event "Manchester Active Weekend" has been cancelled by the admin.',
    scheduledAt: "2026-09-20T09:00:00",
    isRead: false,
  },
  {
    notificationId: 8,
    recipient: "organiser",
    eventId: null,
    type: "account_status",
    subject: "Account Status Changed",
    body: 'Your account status has been updated to "active".',
    scheduledAt: "2026-09-10T14:00:00",
    isRead: true,
  },
  {
    notificationId: 9,
    recipient: "admin",
    eventId: null,
    type: "user_registered",
    subject: "New User Registered",
    body: "A new user has registered: janedoe (jane@email.com), Role: user.",
    scheduledAt: "2026-09-26T18:22:00",
    isRead: false,
  },
  {
    notificationId: 10,
    recipient: "admin",
    eventId: 5,
    type: "event_cancelled_by_organiser",
    subject: "Event Cancelled by Organiser",
    body: 'Event "Manchester Active Weekend" (ID: 5) was cancelled by organiser ID 12.',
    scheduledAt: "2026-09-20T09:00:00",
    isRead: false,
  },
  {
    notificationId: 11,
    recipient: "admin",
    eventId: null,
    type: "system_error",
    subject: "System Error Alert",
    body: "A system error occurred: Failed to send reminder email.",
    scheduledAt: "2026-09-18T03:15:00",
    isRead: true,
  },
];

// Matches get_role_notifications(): newest first
export const allNotifications = [...notifications].sort((a, b) =>
  b.scheduledAt.localeCompare(a.scheduledAt),
);
