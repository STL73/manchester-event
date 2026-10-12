import { CalendarPlus } from "lucide-react";

// The page's one action: making an event is the organiser's main job,
// so it stays on the page (navigation lives in the sidebar)
export const myEventsActions = [
  { label: "Create event", to: "/dashboard/create-events", icon: CalendarPlus },
];

// The status switch above the grid, with counts (decided 2026-10-12; the PHP
// had a dropdown). Values are eventState()s, so an approved event that has
// ended counts as past. Drafts aren't here: they live on My Drafts
export const statusViews = {
  label: "Show events by status",
  options: [
    { value: "all", label: "All" },
    { value: "approved", label: "Live" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
    { value: "past", label: "Past" },
    { value: "cancelled", label: "Cancelled" },
  ],
};

// The line under the title: "7 live · 2 waiting for approval · 1 rejected"
export const myEventsSummary = {
  parts: [
    { state: "approved", text: "live" },
    { state: "pending", text: "waiting for approval" },
    { state: "rejected", text: "rejected" },
  ],
  drafts: { one: "draft", many: "drafts", to: "/dashboard/my-drafts" },
  none: "Nothing submitted yet",
};

// Whole rows of three, as on Explore Events
export const myEventsPageSize = 12;

export const myEventsPaging = {
  showing: (from, to, total) => `Showing ${from}–${to} of ${total} events`,
};

export const sortLabel = "Sort events";

export const myEventsDate = { pick: "Pick a date", clear: "Clear date" };

// Matches get_organiser_events(): newest/oldest sort by start date
export const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

export const myEventsMessages = {
  noMatches: "No events match your filters.",
  clearFilters: "Clear filters",
};
