import {
  CalendarClock,
  CalendarRange,
  Calendars,
  ChartNoAxesCombined,
  ClipboardClock,
} from "lucide-react";

// Organiser page, from event_stats.php
export const eventAnalyticsSection = {
  title: "Event Analytics",
  icon: ChartNoAxesCombined,
};

// Stat cards; counts are worked out from the organiser's events
export const eventAnalyticsCards = [
  {
    id: "total",
    title: "Total Events",
    icon: Calendars,
  },
  {
    id: "pending",
    title: "Pending Approval",
    icon: ClipboardClock,
    tone: "dashboard-card-accent-yellow",
    action: { label: "View", to: "/dashboard/my-events" },
  },
  {
    id: "upcoming",
    title: "Upcoming Events",
    icon: CalendarClock,
  },
  {
    id: "thisMonth",
    title: "This Month",
    icon: CalendarRange,
  },
];

// Organiser events happen on both sides of today, so each range reaches the
// same distance back and forward: past events to compare, the schedule ahead.
export const eventRangeOptions = [
  { value: "3m", label: "±3 months", months: 3, around: true, period: "week", description: "3 months either side of today, by week." },
  { value: "6m", label: "±6 months", months: 6, around: true, period: "month", description: "6 months either side of today, by month." },
  { value: "12m", label: "±12 months", months: 12, around: true, period: "month", description: "12 months either side of today, by month." },
  { value: "all", label: "All time", period: "month", description: "All time, by month." },
];

export const defaultEventRange = "6m";

// Only events that did or will take place go on the timeline
export const timelineStatuses = ["past", "approved", "pending"];

export const timelineSeries = [
  { key: "held", label: "Held" },
  { key: "scheduled", label: "Scheduled" },
];

export const eventAnalyticsCharts = {
  overTime: {
    title: "Events Timeline",
    description:
      "Held and scheduled events by start date (pending ones count as scheduled; drafts, rejected and cancelled are in the status chart).",
    xHeading: "Period",
  },
  byStatus: { title: "Events by Status", description: "All time.", xHeading: "Status" },
  byCategory: {
    title: "Events by Category",
    description: "All time, most events first.",
    xHeading: "Category",
  },
  byLocation: { title: "Events by Location", description: "All time.", xHeading: "Location" },
};
