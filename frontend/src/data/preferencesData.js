import { SquareCheck } from "lucide-react";

import { eventCategories } from "./eventsData";

// The line under the page title: "2 interests · 14 upcoming events match them"
export const preferencesSummary = {
  interest: "interest",
  interests: "interests",
  matching: "upcoming events match them",
  none: "Choose at least one interest to get event alerts",
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
