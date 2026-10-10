import { CalendarSearch } from "lucide-react";

import arenaLightBeams from "../images/events/arena-light-beams.jpg";

// Public /events page intro (signed-out)
export const publicIntro = {
  eyebrow: "Explore Events",
  title: "What's on in Manchester",
  text: "Every upcoming event, soonest first, each one checked by a person before it went live. Narrow it down by date, area or category.",
  // Decorative: the heading says what the page is
  image: { src: arenaLightBeams, alt: "", width: 1600, height: 1200 },
};

// The quick date ranges; ids are the `when` keys in lib/eventDates.js and the
// ?when= values in the URL. Home's "When?" switch uses the same list.
export const whenOptions = [
  { id: "", label: "Any date" },
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
];

export const resultsText = {
  count: (total) => `${total} ${total === 1 ? "event" : "events"}`,
  pickDate: "Pick a date",
  showing: (from, to, total) => `Showing ${from}–${to} of ${total} events`,
  clearAll: "Clear all",
  removeFilter: (label) => `Remove filter: ${label}`,
  empty: "No upcoming events match your search.",
  clearFilters: "Clear filters",
};

export const exploreEventsSection = {
  title: "Explore Events",
  icon: CalendarSearch,
};
