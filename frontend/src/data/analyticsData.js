import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { themeColour } from "../lib/themeColour";

// Shared chart settings and copy for Event Analytics and Site Analytics. Each
// page's own copy is in eventAnalyticsData.js / siteAnalyticsData.js and its
// figures come from lib/analytics.js.
// Recharts colours come from the theme tokens when a chart draws (see
// themeColour), so the charts always match the badges. Faint fills are these
// colours at a lower opacity (`chartOpacity`), not mixed hex values. The CSS
// charts (donut, share bars, honeycomb, grid) read a tone class instead, so
// the tables below map a key to a tone name, never to a colour.
export const chartColours = {
  get accent() {
    return themeColour("accent");
  },
  // The chart background, for rings round dots
  get surface() {
    return themeColour("card");
  },
  get grid() {
    return themeColour("border");
  },
  get axisText() {
    return themeColour("muted");
  },
};

export const chartOpacity = {
  areaFill: 0.1,
  barHover: 0.08,
  // Timeline: scheduled events are the accent at half strength over the card,
  // a quieter step of the held events' colour
  scheduled: 0.5,
};

// The status tones the badges use (styles/base.css), by status. Unverified is
// a label, not a status, so it takes the muted tone like its badge
export const statusTones = {
  approved: "success",
  past: "past",
  rejected: "danger",
  pending: "warning",
  draft: "draft",
  cancelled: "cancelled",
  active: "success",
  unverified: "muted",
  suspended: "danger",
};

// Status order on the Events by Status donut, chosen with the dataviz palette
// validator (dark mode, card surface) so that neighbouring parts never have
// colours that are hard to tell apart: all neighbours pass the colour-blind
// and normal-vision checks.
export const eventStatusOrder = [
  "approved",
  "past",
  "rejected",
  "pending",
  "draft",
  "cancelled",
];

export const chartText = {
  range: "Time range",
  viewTable: "View data table",
  countHeading: "Count",
  noData: "No data yet.",
  metric: "Metric",
  sections: "Sections",
};

// Stat cards always compare the same fixed window, so they stay put while the
// chart's range control changes: "+4 in the last 30 days" (tooltip: "vs 1 in
// the 30 days before")
export const cardTrend = {
  range: { days: 30 },
  label: (count) => `+${count} in the last 30 days`,
  note: (previous) => `vs ${previous} in the 30 days before`,
};

// Saves compare the last 30 days with the 30 before, on both pages. A
// percentage of a small number says little ("+300%" from 2 to 8), so it
// shows only when the 30 days before had at least 10; below that, the figure
export const savesTrend = {
  minimumForChange: 10,
  change: (change) => `${change > 0 ? "+" : ""}${change}% on the 30 days before`,
  previous: (count) => `vs ${count} in the 30 days before`,
  note: (current, previous) =>
    `${current} saves in the last 30 days, ${previous} in the 30 days before`,
};

// Roles on the Accounts panel (decided 2026-10-20): users the accent,
// organisers teal, admins white, kept apart from the status colours
export const roleTones = {
  user: "accent",
  organiser: "teal",
  admin: "foreground",
};

// Notification emails: on is the accent, off is grey stripes (ShareBar)
export const emailTones = { on: "accent", off: "muted" };

// Support reply time: same day is good, over three days is late
export const replySpeedTones = { day: "success", days: "warning", late: "danger" };

// Review decisions: approved below rejected, in their status colours
export const decisionSeries = [
  { key: "approved", label: "Approved", tone: "success" },
  { key: "rejected", label: "Rejected", tone: "danger" },
];

// When events happen: Monday first, and the four times of day
// getWeekTimeGrid counts in (timeSlots in lib/analytics.js)
export const weekGridText = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  slots: ["Morning", "Afternoon", "Evening", "Night"],
  // Stand in for the words where the grid is too narrow for them
  slotIcons: [Sunrise, Sun, Sunset, Moon],
};

// Audience reach honeycomb: brighter = more followers
export const reachText = {
  cell: (name, count) => `${name}: ${count} ${count === 1 ? "follower" : "followers"}`,
  others: (count) => `Top 5 shown; ${count} more in the data table or on hover.`,
  hover: "Hover a cell for its name.",
  keyFewer: "Fewer followers",
  keyMore: "More",
};
