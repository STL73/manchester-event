import {
  AlarmClock,
  CalendarX2,
  ClipboardCheck,
  Eye,
  Hourglass,
  KeyRound,
  Mail,
  MailOpen,
  RefreshCw,
  Sparkles,
  UserCog,
  UserRoundPlus,
} from "lucide-react";

// The line under the page title: "3 unread · newest 27 Sept"
export const notificationsSummary = {
  unread: "unread",
  newest: "newest",
  caughtUp: "You're all caught up",
};

// The envelope shows the state: closed while unread, opening on hover to
// show what a click does, and a faint open one once read. An open envelope
// always means read, which is why Mark All as Read uses it too
export const notificationActions = {
  markAllRead: { label: "Mark All as Read", icon: MailOpen },
  markRead: { label: "Mark as read", icon: Mail, hoverIcon: MailOpen },
  read: { icon: MailOpen },
  viewEvent: { label: "View event", icon: Eye },
};

export const notificationsEmpty = "No notifications yet.";

// All / Unread switch above the list (?show=unread in the URL)
export const notificationsView = {
  label: "Show notifications",
  all: "All",
  unread: (count) => `Unread (${count})`,
  unreadEmpty: "No unread notifications. You're all caught up.",
};

// Rows are collapsed to the subject, so 10 fit a desktop or tablet screen
// without scrolling (measured 2026-10-11); a laptop scrolls about 3 rows
export const notificationsPageSize = 10;

export const notificationsPaging = {
  showing: (from, to, total) => `Showing ${from}–${to} of ${total} notifications`,
};

// The list is grouped by when each notification arrived
export const notificationGroups = {
  today: "Today",
  week: "Earlier this week",
  earlier: "Earlier",
};

// Label and icon for each notifications.type: the fixed names agreed for
// the backend (system errors go to the server log instead, so there's no
// type). Cancellations take the cancelled badge's orange. CalendarPlus
// already means "create event", so it isn't used here
export const notificationTypes = {
  category_new_event: { label: "New event", icon: Sparkles },
  event_update: { label: "Event update", icon: RefreshCw },
  event_reminder_week: { label: "Reminder: a week to go", icon: AlarmClock },
  event_reminder_day: { label: "Reminder: tomorrow", icon: AlarmClock },
  event_cancelled: { label: "Event cancelled", icon: CalendarX2, cancelled: true },
  event_status: { label: "Event status", icon: ClipboardCheck },
  account_status: { label: "Account status", icon: UserCog },
  password_changed: { label: "Password changed", icon: KeyRound },
  user_registered: { label: "New user", icon: UserRoundPlus },
  event_cancelled_by_organiser: { label: "Cancelled by organiser", icon: CalendarX2, cancelled: true },
  event_pending_review: { label: "Awaiting review", icon: Hourglass },
};

// Mock of the notifications table (read_at, created_at as in the schema);
// recipient is the role it was sent to. Dates follow the events they're
// about: an approval when the admin approved it, a cancellation when the
// organiser cancelled. Reminders (decided 2026-10-11) go out at 09:00 a
// week before and 09:00 the day before, for approved events only; one whose
// time had passed when the event was favourited is skipped
const notifications = [
  {
    notificationId: 1,
    recipient: "user",
    eventId: 1,
    type: "event_reminder_week",
    subject: "Next week: Manchester Live Sessions",
    body: 'Your favourite event "Manchester Live Sessions" is a week away, on Sunday 18 October at 19:30.',
    createdAt: "2026-10-11T09:00:00",
    readAt: null,
  },
  {
    notificationId: 2,
    recipient: "user",
    eventId: 4,
    type: "category_new_event",
    subject: "New Event: Live at MediaCity",
    body: 'A new event "Live at MediaCity" was added to Music, one of your interests.',
    createdAt: "2026-09-26T10:00:00",
    readAt: null,
  },
  {
    notificationId: 3,
    recipient: "user",
    eventId: 3,
    type: "event_update",
    subject: "Updated: Manchester Community Day",
    body: 'Your favourite event "Manchester Community Day" has been updated. Check the latest details.',
    createdAt: "2026-09-24T16:40:00",
    readAt: null,
  },
  {
    notificationId: 4,
    recipient: "user",
    eventId: 5,
    type: "event_cancelled",
    subject: "Cancelled: Manchester Active Weekend",
    body: 'Your favourite event "Manchester Active Weekend" has been cancelled by its organiser.',
    createdAt: "2026-09-18T12:00:00",
    readAt: "2026-09-18T19:42:00",
  },
  {
    notificationId: 5,
    recipient: "user",
    eventId: null,
    type: "password_changed",
    subject: "Password Changed",
    body: "Hello userName, your account password was changed. If this was not you, please contact support immediately.",
    createdAt: "2026-09-15T21:12:00",
    readAt: "2026-09-15T21:13:00",
  },
  {
    notificationId: 12,
    recipient: "user",
    eventId: 8,
    type: "event_reminder_day",
    subject: "Tomorrow: Summer Jazz in the Park",
    body: 'Your favourite event "Summer Jazz in the Park" is tomorrow, Saturday 25 July at 19:00.',
    createdAt: "2026-07-24T09:00:00",
    readAt: "2026-07-24T12:31:00",
  },
  {
    notificationId: 6,
    recipient: "organiser",
    eventId: 2,
    type: "event_status",
    subject: "Approved: Northern Art After Dark",
    body: 'Your event "Northern Art After Dark" has been approved and is now public.',
    createdAt: "2026-09-27T10:42:00",
    readAt: null,
  },
  {
    notificationId: 7,
    recipient: "organiser",
    eventId: 20,
    type: "event_status",
    subject: "Not approved: Dessert Masterclass",
    body: 'Your event "Dessert Masterclass" was not approved. Reason: the description doesn\'t give the venue or the price. Edit the event and submit it again.',
    createdAt: "2026-09-08T16:20:00",
    readAt: null,
  },
  {
    notificationId: 8,
    recipient: "organiser",
    eventId: null,
    type: "account_status",
    subject: "Account Status Changed",
    body: 'Your account status has been updated to "active".',
    createdAt: "2026-09-10T14:00:00",
    readAt: "2026-09-10T18:30:00",
  },
  {
    notificationId: 9,
    recipient: "admin",
    eventId: 6,
    type: "event_pending_review",
    subject: "Awaiting review: People of Manchester",
    body: 'A new event "People of Manchester" has been submitted and is waiting for review.',
    createdAt: "2026-09-26T20:10:00",
    readAt: null,
  },
  {
    notificationId: 10,
    recipient: "admin",
    eventId: null,
    type: "user_registered",
    subject: "New User Registered",
    body: "A new user has registered: janedoe (jane@email.com), role: user.",
    createdAt: "2026-09-26T18:22:00",
    readAt: null,
  },
  {
    notificationId: 11,
    recipient: "admin",
    eventId: 5,
    type: "event_cancelled_by_organiser",
    subject: "Cancelled by organiser: Manchester Active Weekend",
    body: 'The event "Manchester Active Weekend" was cancelled by its organiser, organiserName.',
    createdAt: "2026-09-18T12:00:00",
    readAt: "2026-09-18T14:05:00",
  },
];

// Matches get_role_notifications(): newest first
export const initialNotifications = [...notifications].sort((a, b) =>
  b.createdAt.localeCompare(a.createdAt),
);

// Which group a notification falls in. "This week" runs from Monday, so on
// a Monday there is only Today and Earlier
export function notificationGroup(createdAt, now) {
  const created = new Date(createdAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (created >= today) return "today";
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return created >= monday ? "week" : "earlier";
}
