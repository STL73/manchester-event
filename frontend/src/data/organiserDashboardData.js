import {
  CalendarCheck,
  CircleX,
  ClipboardClock,
  Heart,
  SquarePen,
} from "lucide-react";

// Quick Insights: what needs the organiser and how their events are doing.
// Counted live on the page from their events; this is the copy. Waiting and
// rejected keep the PHP status colours
export const organiserInsights = {
  live: {
    title: "Live events",
    icon: CalendarCheck,
    next: "Next:",
    none: "Nothing live yet",
  },
  pending: {
    title: "Awaiting approval",
    icon: ClipboardClock,
    tone: "dashboard-card-accent-yellow",
    oldest: (days) => `Oldest: ${days === 1 ? "1 day" : `${days} days`}`,
    to: "/dashboard/my-events?status=pending",
    none: "Nothing waiting",
  },
  rejected: {
    title: "Rejected",
    icon: CircleX,
    tone: "dashboard-card-accent-red",
    action: { label: "Edit and resubmit", to: "/dashboard/my-events?status=rejected" },
    none: "Nothing to fix",
  },
  drafts: {
    title: "Drafts",
    icon: SquarePen,
    oldest: (days) => `Oldest: ${days === 1 ? "1 day" : `${days} days`}`,
    to: "/dashboard/my-drafts",
    none: "No drafts",
  },
  saved: {
    title: "Saved by users",
    icon: Heart,
    mostSaved: "Most saved:",
    none: "Not saved by anyone yet",
  },
};
