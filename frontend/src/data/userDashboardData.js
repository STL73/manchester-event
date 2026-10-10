import {
  Bell,
  CalendarClock,
  Heart,
  Sparkles,
} from "lucide-react";

const chooseInterests = {
  label: "Choose your interests",
  to: "/dashboard/preferences",
  always: true,
};

// Quick Insights: what's coming for this user. Counted live on the page
// from favourites, interests and notifications; this is the copy
export const userInsights = {
  saved: {
    title: "Saved events",
    icon: Heart,
    next: "Next:",
    none: "Save events with the heart",
  },
  thisWeek: {
    title: "This week for you",
    icon: CalendarClock,
    noInterests: chooseInterests,
  },
  newForYou: {
    title: "New in your interests",
    icon: Sparkles,
    view: { label: "View", to: "/dashboard/explore-events" },
    none: "Nothing new in the last 7 days",
    noInterests: chooseInterests,
  },
  unread: {
    title: "Unread notifications",
    icon: Bell,
    newest: "Newest:",
    to: "/dashboard/notifications",
    none: "You're all caught up",
  },
};
