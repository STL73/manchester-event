// Shared chart settings for Event Analytics and Site Analytics.
// SVG chart fills need plain hex, so these are the exact hex versions of the
// theme tokens and Tailwind status colours used by the badges.
export const chartColours = {
  accent: "#8e98f3", // --color-accent
  surface: "#121a31", // --color-card (chart background)
  grid: "#243460", // --color-border
  axisText: "#a1aabf", // --color-muted
  areaFill: "rgba(142, 152, 243, 0.1)", // accent at 10%
  barHover: "rgba(142, 152, 243, 0.08)",
  // Timeline: held events in the accent, scheduled ones in a quieter step of
  // the same hue (accent mixed 50/50 with the card surface)
  held: "#8e98f3",
  scheduled: "#50598f",
};

// Same colours as the status badges (PHP input.css)
export const statusColours = {
  approved: "#05df72", // green-400
  past: "#d1d5dc", // gray-300
  rejected: "#ff6467", // red-400
  pending: "#fdc700", // yellow-400
  draft: "#53eafd", // cyan-300
  cancelled: "#ff8904", // orange-400
  active: "#05df72",
  suspended: "#ff6467",
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

// Active and Suspended are 7.7 apart for colour-blind readers (target 8), which
// is allowed because every bar is also named on the axis and in the table.
export const accountStatusOrder = ["active", "suspended", "pending"];

export const chartText = {
  range: "Time range",
  viewTable: "View data table",
  countHeading: "Count",
  noData: "No data yet.",
  metric: "Metric",
};

// Stat cards always compare the same fixed window, so they stay put while the
// chart's range control changes: "+4 in the last 30 days" (tooltip: "vs 1 in
// the 30 days before")
export const cardTrend = {
  range: { days: 30 },
  label: (count) => `+${count} in the last 30 days`,
  note: (previous) => `vs ${previous} in the 30 days before`,
};
