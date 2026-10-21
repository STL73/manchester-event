import { ChartNoAxesCombined, Heart, Timer, Calendars, Users } from "lucide-react";

// Admin page, from admin_stats.php
export const siteAnalyticsSection = {
  title: "Site Analytics",
  icon: ChartNoAxesCombined,
};

// Sections, one shown at a time under the stat cards (`?tab=` in the URL);
// the same layout as Event Analytics (decided 2026-10-20)
export const siteAnalyticsTabs = [
  { value: "growth", label: "Growth" },
  { value: "moderation", label: "Moderation" },
  { value: "engagement", label: "Engagement" },
  { value: "safety", label: "Safety and support" },
];

// Stat cards (decided 2026-10-20): how the site grows, how much is saved and
// how fast events are reviewed. Admin Home keeps its own cards
// (siteTotalsCards), which are about what needs doing. Counted on the page
export const siteAnalyticsCards = {
  users: { title: "Users", icon: Users },
  events: { title: "Events", icon: Calendars },
  saves: { title: "Saves", icon: Heart },
  reviewTime: {
    title: "Review Time",
    icon: Timer,
    detail: "average, submit to decision",
  },
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

// The growth chart shows one metric at a time; the switch sits beside the
// range. Saves live here rather than in a chart of their own (2026-10-20)
export const growthMetrics = [
  {
    value: "users",
    label: "Users",
    title: "New Users",
    description: "New accounts by sign-up date.",
    valueLabel: "users",
  },
  {
    value: "events",
    label: "Events",
    title: "New Events",
    description: "Events by the date they were created.",
    valueLabel: "events",
  },
  {
    value: "saves",
    label: "Saves",
    title: "Saves",
    description: "Events saved, by the date saved.",
    valueLabel: "saves",
  },
];

// Labels for the Accounts panel and the support reply bar
export const roleLabels = { user: "User", organiser: "Organiser", admin: "Admin" };
export const emailLabels = { on: "On", off: "Off" };
export const replySpeedLabels = { day: "Same day", days: "1–3 days", late: "Over 3 days" };

// "today", "1 day ago", "5 days ago"
export function daysAgo(days) {
  if (days < 1) return "today";
  return days < 2 ? "1 day ago" : `${Math.floor(days)} days ago`;
}

export const siteAnalyticsCharts = {
  growth: { xHeading: "Period" },
  funnel: {
    title: "Sign-up Funnel",
    description: "Everyone who registered, how many verified their email and how many are active.",
    steps: {
      registered: "Registered",
      verified: "Verified email",
      active: "Active, not suspended",
    },
    share: (percent, of) => `${percent}%${of ? ` of ${of}` : ""}`,
    verifiedOf: "verified",
    never: (count) =>
      `${count} ${count === 1 ? "account has" : "accounts have"} never verified.`,
  },
  organisers: {
    title: "Organiser Activity",
    description: (active, total) =>
      `${active} of ${total} organisers submitted or changed an event in the last 30 days.`,
    detail: (live, ago) => `${live} live · last submitted ${ago}`,
    empty: "No organiser has a live event.",
  },
  accounts: {
    title: "Accounts",
    description: "Everyone with an account, three ways.",
    xHeading: "Group",
    roles: "By role",
    statuses: "By status",
    emails: "Notification emails",
  },
  decisionTime: {
    title: "Time to Decision",
    description: "Average hours from submit to approve or reject, by month.",
    xHeading: "Month",
    columns: [{ key: "count", heading: "Average hours" }],
    facts: {
      thisMonth: "This month",
      was: (hours, month) => `was ${hours} h in ${month}`,
      noDecisions: "no decisions yet",
      waiting: "Waiting now",
      oldest: (wait) => `oldest ${wait}`,
      nothingWaiting: "nothing waiting",
      rejected: "Rejected",
      rejectedDetail: "of decisions, last 6 months",
    },
  },
  decisions: {
    title: "Review Decisions",
    description: "Events approved and rejected by month, with the share rejected.",
    xHeading: "Month",
    columns: [
      { key: "approved", heading: "Approved" },
      { key: "rejected", heading: "Rejected" },
      { key: "rejectedShare", heading: "Rejected %" },
    ],
  },
  eventsByStatus: { title: "Events by Status", description: "All events, drafts included.", xHeading: "Status" },
  waiting: {
    title: "Waiting Longest",
    description: "Pending events, oldest first.",
    detail: (organiser, date) => `${organiser} · submitted ${date}`,
    empty: "Nothing waiting for review.",
  },
  // Followers and events per category (FollowersHoneycomb, decided
  // 2026-10-20). Slav turned down: bars per category (too tall), followers
  // per event as one bar, and a follower line in Most Saved (too easy to
  // miss); a "needs more events" flag (nobody here creates events)
  supply: {
    title: "Followers and Events",
    description: "People following each category and the public events coming up in it.",
    xHeading: "Category",
    columns: [
      { key: "followers", heading: "Following" },
      { key: "upcoming", heading: "Upcoming events" },
      { key: "perEventLabel", heading: "Followers per event" },
    ],
    allTitle: "All categories",
    // Summed over categories, so these are follows: one person can follow several
    totals: (follows, events) =>
      `${follows} follows · ${events} ${events === 1 ? "event" : "events"} coming up`,
    following: "People following",
    upcoming: "Events coming up",
    perEvent: "Followers per event",
    reach: (count) => `Each event here can reach about ${count} ${count === 1 ? "person" : "people"}.`,
    noFollowers: "No one follows this category yet.",
    noEvents: (count) =>
      `Nothing coming up yet for its ${count} ${count === 1 ? "follower" : "followers"}.`,
    back: "All categories",
    hint: "Select a category for its events.",
    keyFewer: "Fewer followers per event",
    keyMore: "More",
  },
  mostSaved: {
    title: "Most Saved Events",
    description: "Upcoming public events, by saves.",
    empty: "No upcoming event has been saved yet.",
  },
  when: {
    title: "When Events Happen",
    description: "Start times of upcoming public events, by day and time of day.",
    xHeading: "Day",
    busiest: (day, slot) => `Most start on ${day} ${slot}.`,
  },
  failedSignIns: {
    title: "Failed Sign-ins",
    description: "Per day, last 14 days. A spike can mean someone is guessing passwords.",
    xHeading: "Day",
    columns: [{ key: "count", heading: "Failed sign-ins" }],
    callout: (count, day) => `${count} on ${day}`,
  },
  suspensions: {
    title: "Suspensions",
    description: "Suspended accounts, and the suspensions that end this week.",
    facts: {
      suspended: "Suspended",
      indefinite: (count) => `${count} with no end date`,
      endingSoon: "Ending this week",
      lifted: "lifted automatically",
    },
    detail: (reason, date) => `${reason} · ends ${date}`,
    none: "No suspension ends in the next 7 days.",
  },
  support: {
    title: "Support",
    description: "Contact messages and how fast they get a reply.",
    facts: {
      averageReply: "Average reply",
      averageDetail: "sent to replied",
      unread: "Unread",
      overdue: "Over 3 days",
      overdueDetail: "no reply yet",
    },
    replySpeed: "Reply time",
  },
};
