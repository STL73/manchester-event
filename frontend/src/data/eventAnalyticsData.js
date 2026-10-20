import { BadgeCheck, CalendarCheck, ChartNoAxesCombined, Heart, UsersRound } from "lucide-react";

// Organiser page, from event_stats.php
export const eventAnalyticsSection = {
  title: "Event Analytics",
  icon: ChartNoAxesCombined,
};

// Sections, one shown at a time under the stat cards (`?tab=` in the URL);
// the same layout as Site Analytics (decided 2026-10-20)
export const eventAnalyticsTabs = [
  { value: "overview", label: "Overview" },
  { value: "audience", label: "Audience" },
  { value: "approval", label: "Approval" },
  { value: "what-where", label: "What and where" },
];

// Stat cards (decided 2026-10-20): what is live, how much it is saved, how
// it gets through review and how many people it can reach. Counted on the
// page; this is the copy
export const eventAnalyticsCards = {
  live: {
    title: "Live Events",
    icon: CalendarCheck,
    next: (date) => `Next on ${date}`,
    none: "Nothing live yet",
  },
  saves: {
    title: "Saves",
    icon: Heart,
  },
  approval: {
    title: "Approval Rate",
    icon: BadgeCheck,
    decided: (approved, decided) => `${approved} of ${decided} decided`,
    none: "Nothing decided yet",
  },
  reach: {
    title: "Audience Reach",
    icon: UsersRound,
    detail: (count) => `following your ${count === 1 ? "category" : `${count} categories`}`,
  },
};

// Saves compare the last 30 days with the 30 before. A percentage of a small
// number says little ("+300%" from 2 to 8), so it shows only when the 30
// days before had at least 10; below that, the plain figure
export const savesTrend = {
  minimumForChange: 10,
  change: (change) => `${change > 0 ? "+" : ""}${change}% on the 30 days before`,
  previous: (count) => `vs ${count} in the 30 days before`,
  note: (current, previous) =>
    `${current} saves in the last 30 days, ${previous} in the 30 days before`,
};

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
  upNext: {
    title: "Up Next",
    description: "Your live events, soonest first, with how many have saved each.",
    empty: "Nothing live coming up.",
    more: (count) => `and ${count} more on My Events`,
  },
  reach: {
    title: "Audience Reach",
    description:
      "People following the categories you post in. They are told when you post in one.",
    xHeading: "Category",
    columns: [{ key: "count", heading: "Followers" }],
  },
  saves: {
    title: "Saves",
    description: "Events of yours saved by users, by month over the last 6 months.",
    xHeading: "Month",
    columns: [{ key: "count", heading: "Saves" }],
    facts: {
      last30: "Last 30 days",
      allTime: "All time",
      events: (count) => `across ${count} ${count === 1 ? "event" : "events"}`,
      busiest: "Busiest day",
      busiestShare: (share) => `1 in ${Math.round(1 / share)} saves`,
      none: "None yet",
    },
    callout: (count, month) => `${count} in ${month}`,
  },
  mostSaved: {
    title: "Most Saved",
    description: "Your events with the most saves, all time.",
  },
  savesByCategory: {
    title: "Saves by Category",
    description: "All time, most saved first.",
    xHeading: "Category",
    columns: [{ key: "count", heading: "Saves" }],
  },
  approval: {
    title: "Approval Record",
    description: "How your submitted events got through review.",
    facts: {
      approved: "Approved",
      decided: (approved, decided) => `${approved} of ${decided} decided`,
      wait: "Average wait",
      waitDetail: "submit to decision",
      waiting: "Waiting now",
      oldest: (wait) => `oldest ${wait}`,
      nothingWaiting: "nothing waiting",
    },
    reasons: "Latest rejection reasons",
    noReasons: "Nothing rejected. Every event you submitted got through.",
  },
  byStatus: { title: "Events by Status", description: "All your events, drafts included.", xHeading: "Status" },
  when: {
    title: "When Events Happen",
    description: "Start times of your events, by day and time of day.",
    xHeading: "Day",
    busiest: (day, slot) => `Most start on ${day} ${slot}.`,
  },
  byCategory: {
    title: "Events by Category",
    description: "All time, most events first.",
    xHeading: "Category",
  },
  byLocation: { title: "Events by Location", description: "All time.", xHeading: "Location" },
};
