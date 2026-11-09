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
// without scrolling; a laptop scrolls about 3 rows
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

// Label and icon for each notifications.type, the backend's fixed names.
// CalendarPlus already means "create event", so it isn't used here
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
