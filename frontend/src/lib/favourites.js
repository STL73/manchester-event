// The user's favourites, sorted and split for My Favourites, Home and the greeting
import { bySoonest, isUpcoming } from "./eventDates";
import { isPublicEvent } from "./eventStatus";

// Approved favourites, newest start date first, for Home's recent favourites
export function getFavouriteEvents(events, favouriteIds) {
  return events
    .filter((event) => isPublicEvent(event) && favouriteIds.includes(event.eventId))
    .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime));
}

// Where a favourite stands: upcoming, past or cancelled; anything else isn't shown
function favouriteState(event, now) {
  if (event.status === "cancelled") return "cancelled";
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
