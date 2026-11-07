import { History } from "lucide-react";

// The line under the page title: "3 saved · next one Sun 18 Oct"
export const favouritesSummary = {
  saved: "saved",
  nextOne: "next one",
  none: "Save events with the heart to see them here",
};

// When there's nothing to come: none saved at all, or only ended ones
export const favouritesEmpty = {
  none: "You do not have any favourite events yet.",
  noneUpcoming: "None of your favourite events are coming up.",
};

// Favourites whose event has finished or been called off. The schema keeps
// them (greyed, with a label) rather than dropping them from the list
export const endedFavourites = {
  title: "Past and cancelled",
  icon: History,
};

export const addToCalendar = { label: "Add to calendar" };

// The message when a heart couldn't change (the server's reason), and how
// long it stays before it goes by itself
export const favouriteError = {
  dismiss: "Dismiss",
  shownFor: 8000,
};
