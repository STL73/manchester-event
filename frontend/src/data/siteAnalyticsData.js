import { ChartNoAxesCombined } from "lucide-react";

// Admin page, from admin_stats.php
export const siteAnalyticsSection = {
  title: "Site Analytics",
  icon: ChartNoAxesCombined,
};

// Sign-ups and event creations only happen in the past, so every range looks
// back from today. The grouping follows the range. The control sits in the
// growth chart's header and changes only that chart.
export const siteRangeOptions = [
  { value: "7d", label: "Last 7 days", days: 7, period: "day", description: "Last 7 days, by day." },
  { value: "30d", label: "Last 30 days", days: 30, period: "day", description: "Last 30 days, by day." },
  { value: "12m", label: "Last 12 months", months: 12, period: "month", description: "Last 12 months, by month." },
  { value: "all", label: "All time", period: "month", description: "All time, by month." },
];

export const defaultSiteRange = "12m";

// The growth chart shows one metric at a time; the switch sits beside the range
export const growthMetrics = [
  {
    value: "users",
    label: "New users",
    title: "User Registrations Over Time",
    description: "New accounts by sign-up date.",
    valueLabel: "users",
  },
  {
    value: "events",
    label: "New events",
    title: "Events Created Over Time",
    description: "Events by the date they were created.",
    valueLabel: "events",
  },
];

// Cards that get a 30-day trend line, and the date it is counted by
export const siteTrendCards = {
  users: "createdAt",
  events: "createdAt",
};

export const siteAnalyticsCharts = {
  growth: { xHeading: "Period" },
  usersByRole: { title: "Users by Role", description: "All time.", xHeading: "Role" },
  usersByStatus: { title: "Users by Account Status", description: "All time.", xHeading: "Account status" },
  eventsByStatus: { title: "Events by Status", description: "All time.", xHeading: "Status" },
  eventsByCategory: {
    title: "Events by Category",
    description: "All time, most events first. Categories with no events are left out.",
    xHeading: "Category",
  },
};
