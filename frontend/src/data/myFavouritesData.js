import { History } from "lucide-react";
import { isPublicEvent } from "./eventsData";
import { bySoonest, isUpcoming } from "../lib/eventDates";

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

// Mock of the user's rows in the favourites table (held in App state).
// 8 has finished and 5 was cancelled, so the second section has something
export const initialFavouriteIds = [1, 3, 4, 8, 5];

// Mock of COUNT(*) per event_id across everyone's favourites, which
// organisers see for their own events. Unlisted events have none
export const favouriteCounts = {
  1: 24,
  2: 9,
  3: 12,
  4: 15,
  18: 6,
  37: 4,
  43: 17,
  44: 3,
  51: 7,
  52: 5,
};

// Matches get_user_favourites(): approved events only, newest start date first.
// Home's recent favourites use it; My Favourites splits the list below
export function getFavouriteEvents(events, favouriteIds) {
  return events
    .filter((event) => isPublicEvent(event) && favouriteIds.includes(event.eventId))
    .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime));
}

// Where a favourite stands. The mock still stores "past" on some events;
// the database won't, so an approved event whose time has gone counts too.
// Anything else (an event taken back to pending, say) isn't shown
export function favouriteState(event, now) {
  if (event.status === "cancelled") return "cancelled";
  if (event.status === "past") return "past";
  if (isPublicEvent(event)) return isUpcoming(event, now) ? "upcoming" : "past";
  return null;
}

// My Favourites: what's still to come, soonest first, then what has ended
// or been cancelled, most recent first
export function splitFavourites(events, favouriteIds, now) {
  const favourites = events.filter((event) => favouriteIds.includes(event.eventId));
  const withState = (state) => favourites.filter((event) => favouriteState(event, now) === state);

  return {
    upcoming: withState("upcoming").sort(bySoonest),
    ended: [...withState("past"), ...withState("cancelled")].sort((a, b) =>
      b.startDatetime.localeCompare(a.startDatetime),
    ),
  };
}

// Soonest approved favourite that has not started yet
export function getNextFavourite(events, favouriteIds) {
  const now = new Date();
  return events
    .filter(
      (event) =>
        favouriteIds.includes(event.eventId) &&
        isPublicEvent(event) &&
        new Date(event.startDatetime) > now,
    )
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))[0];
}
