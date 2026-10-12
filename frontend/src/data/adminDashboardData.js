import {
  CalendarCheck,
  Calendars,
  ClipboardClock,
  Logs,
  MessageSquareText,
  UserRoundPlus,
  UserRoundSearch,
  Users,
} from "lucide-react";

import { systemLogs } from "./systemLogsData";

const daysLabel = (days) => (days === 1 ? "1 day" : `${days} days`);

// Admin home Quick Insights: what needs the admin and how the site is doing.
// Counted live on the page from the shared users, events and messages
export const adminInsights = {
  review: {
    title: "Events to review",
    icon: ClipboardClock,
    tone: "dashboard-card-accent-yellow",
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

// Site Analytics' total cards. No counts here: the page fills them in live
// with getSiteTotals() (lib/analytics.js)
export const siteTotalsCards = [
  {
    id: "events",
    title: "Total Events",
    icon: Calendars,
  },
  {
    id: "pendingEvents",
    title: "Events Waiting Approval",
    icon: ClipboardClock,
    tone: "dashboard-card-accent-yellow",
    action: { label: "Review", to: "/dashboard/manage-events" },
  },
  {
    id: "users",
    title: "Total Users",
    icon: Users,
  },
  {
    id: "unverifiedUsers",
    title: "Unverified Accounts",
    icon: UserRoundSearch,
    // Nothing for the admin to do: only the user can verify their email
    detail: "Can't submit events or get emails yet",
  },
];

export const viewAllLogsAction = {
  label: "View All Logs",
  to: "/dashboard/system-logs",
  icon: Logs,
};

// Matches get_recent_admin_actions(): the newest 5 logs by admins, found
// by the role copied into each row (system_logs.role in the schema)
export const recentAdminActions = systemLogs.filter((log) => log.role === "admin").slice(0, 5);
