import { isPublicEvent } from "./eventsData";

// The line under the page title: "3 saved · next one Sun 18 Oct"
export const favouritesSummary = {
  saved: "saved",
  nextOne: "next one",
  none: "Save events with the heart to see them here",
};

// Mock of the user's rows in the favourites table (held in App state)
export const initialFavouriteIds = [1, 3, 4];

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

// Matches get_user_favourites(): approved events only, newest start date first
export function getFavouriteEvents(events, favouriteIds) {
  return events
    .filter((event) => isPublicEvent(event) && favouriteIds.includes(event.eventId))
    .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime));
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
