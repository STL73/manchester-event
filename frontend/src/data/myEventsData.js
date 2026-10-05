import { CalendarPlus, ListFilter, SquarePen } from "lucide-react";

import { eventStatuses } from "./manageEventsData";

export const myEventsActions = [
  { label: "Create Events", to: "/dashboard/create-events", icon: CalendarPlus },
  { label: "My Drafts", to: "/dashboard/my-drafts", icon: SquarePen },
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
