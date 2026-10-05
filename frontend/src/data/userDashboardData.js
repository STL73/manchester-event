import {
  Bell,
  CalendarClock,
  CalendarSearch,
  Heart,
  Settings2,
} from "lucide-react";

export const dashboardActions = [
  { label: "Explore Events", to: "/dashboard/explore-events", icon: CalendarSearch },
  { label: "My Favourites", to: "/dashboard/my-favourites", icon: Heart },
  { label: "Update Preferences", to: "/dashboard/preferences", icon: Settings2 },
  { label: "View Notifications", to: "/dashboard/notifications", icon: Bell },
];

export const dashboardInsights = [
  {
    // Count comes from the shared favourites list in App
    id: "favourites",
    title: "My Favourites",
    icon: Heart,
  },
  {
    title: "Upcoming Events",
    icon: CalendarClock,
    count: 5,
  },
  {
    title: "Unread Notifications",
    icon: Bell,
    count: 3,
  },
  {
    title: "Preferences",
    icon: Settings2,
    count: 4,
  },
];
