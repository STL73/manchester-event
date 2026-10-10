import { CalendarPlus, ListFilter } from "lucide-react";

import { eventStatuses } from "./manageEventsData";

// The page's one action: making an event is the organiser's main job,
// so it stays on the page (navigation lives in the sidebar)
export const myEventsActions = [
  { label: "Create event", to: "/dashboard/create-events", icon: CalendarPlus },
];

export const myEventsFilterIntro =
  "Filter by Date, Category, Location or Keyword. Sort by Status, Alphabetic and Numeric Order.";

// Matches the status dropdown in my_events.php
export const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  ...eventStatuses,
];

// Matches get_organiser_events(): newest/oldest sort by start date
export const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

export const applyFiltersAction = { label: "Apply", icon: ListFilter };

export const myEventsMessages = {
  noMatches: "No events match your filters.",
  clearFilters: "Clear filters",
};
