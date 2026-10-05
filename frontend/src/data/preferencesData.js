import { CalendarSearch, Heart, Settings2, SquareCheck } from "lucide-react";

import { eventCategories } from "./eventsData";

export const preferencesActions = [
  { label: "Explore Events", to: "/dashboard/explore-events", icon: CalendarSearch },
  { label: "My Favourites", to: "/dashboard/my-favourites", icon: Heart },
];

export const interestsInsight = {
  title: "Interests",
  icon: Settings2,
};

export const preferencesForm = {
  title: "Select Your Interests",
  description:
    "Choose the event categories you are interested in and we will notify you about upcoming events.",
  submit: { label: "Save Preferences", icon: SquareCheck },
};

// Matches get_all_categories(): ordered by name
export const preferenceCategories = [...eventCategories].sort((a, b) =>
  a.name.localeCompare(b.name),
);

// Mock of the user's rows in the notification_preferences table
export const userCategoryIds = ["music", "community-culture"];
