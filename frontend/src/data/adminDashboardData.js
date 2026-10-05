import {
  Calendars,
  ChartNoAxesCombined,
  ClipboardClock,
  ClipboardList,
  Logs,
  UserRoundSearch,
  Users,
} from "lucide-react";

import { systemLogs } from "./systemLogsData";

// Admin accounts in the users mock
const adminUserIds = [1];

export const adminDashboardActions = [
  { label: "Manage Users", to: "/dashboard/manage-users", icon: Users },
  { label: "Manage Events", to: "/dashboard/manage-events", icon: ClipboardList },
  {
    label: "Site Analytics",
    to: "/dashboard/site-analytics",
    icon: ChartNoAxesCombined,
  },
  { label: "System Logs", to: "/dashboard/system-logs", icon: Logs },
];

// Admin home Quick Insights, reused by Site Analytics. No counts here:
// both pages fill them in live with getSiteTotals() (lib/analytics.js)
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
    id: "pendingUsers",
    title: "Pending Users",
    icon: UserRoundSearch,
    tone: "dashboard-card-accent-yellow",
    action: { label: "Review", to: "/dashboard/manage-users" },
  },
];

export const viewAllLogsAction = {
  label: "View All Logs",
  to: "/dashboard/system-logs",
  icon: Logs,
};

// Matches get_recent_admin_actions(): the admin users' system logs,
// newest first, limit 5 (read from the shared system logs mock)
export const recentAdminActions = systemLogs
  .filter((log) => adminUserIds.includes(log.userId))
  .slice(0, 5);
