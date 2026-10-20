import { themeColour } from "../lib/themeColour";

// Shared chart settings for Event Analytics and Site Analytics.
// Colours come from the theme tokens when a chart draws (see themeColour), so
// the charts always match the badges. Faint fills are these colours at a lower
// opacity (`chartOpacity`), not mixed hex values.
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

// Bar order chosen with the dataviz palette validator (dark mode, card surface)
// so that neighbouring bars never have colours that are hard to tell apart:
// all neighbours pass the colour-blind and normal-vision checks.
export const eventStatusOrder = [
  "approved",
  "past",
  "rejected",
  "pending",
  "draft",
  "cancelled",
];

// Unverified (grey) sits between Active and Suspended, so the green and red
// that are hardest to tell apart are never side by side
export const accountStatusOrder = ["active", "unverified", "suspended"];

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
