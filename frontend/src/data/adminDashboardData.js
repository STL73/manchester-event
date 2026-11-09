import {
  CalendarCheck,
  ClipboardClock,
  Logs,
  MessageSquareText,
  UserRoundPlus,
} from "lucide-react";

const daysLabel = (days) => (days === 1 ? "1 day" : `${days} days`);

// Admin home Quick Insights: what needs the admin and how the site is doing.
// Counted live on the page from the shared users, events and messages
export const adminInsights = {
  review: {
    title: "Events to review",
    icon: ClipboardClock,
    tone: "warning",
    oldest: (days) => `Oldest: ${daysLabel(days)}`,
    resubmitted: "resubmitted",
    to: "/dashboard/manage-events",
    none: "Nothing waiting",
  },
  messages: {
    title: "Unread messages",
    icon: MessageSquareText,
    oldest: (days) => `Oldest: ${daysLabel(days)}`,
    to: "/dashboard/contact-messages",
    none: "All read",
  },
  newUsers: {
    title: "New users",
    icon: UserRoundPlus,
    total: (count) => `${count} in total`,
    note: (previous) => `${previous} in the 30 days before`,
  },
  live: {
    title: "Live events",
    icon: CalendarCheck,
    total: (count) => `${count} in total`,
    weekend: (count) => `${count} this weekend`,
  },
};

export const viewAllLogsAction = {
  label: "View All Logs",
  to: "/dashboard/system-logs",
  icon: Logs,
};

// Recent Admin Actions: the newest 5 rows by admins, without sign-ins and
// sign-outs, which pushed every decision off the card
export const recentAdminActionsPath = "/logs?view=admin-actions&limit=5";
export const recentAdminActionsText = {
  empty: "No recent admin actions.",
  loadError: "Recent admin actions couldn't be loaded just now.",
};
