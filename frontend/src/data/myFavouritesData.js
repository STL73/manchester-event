import { CalendarSearch, Heart, Settings2 } from "lucide-react";

import { isPublicEvent } from "./eventsData";

export const myFavouritesActions = [
  { label: "Explore Events", to: "/dashboard/explore-events", icon: CalendarSearch },
  { label: "Update Preferences", to: "/dashboard/preferences", icon: Settings2 },
];

export const favouritesInsight = {
  title: "Total Favourites",
  icon: Heart,
};

// Mock of the user's rows in the favourites table (held in App state)
export const initialFavouriteIds = [1, 3, 4];

// Matches get_user_favourites(): approved events only, newest start date first
export function getFavouriteEvents(events, favouriteIds) {
  return events
    .filter((event) => isPublicEvent(event) && favouriteIds.includes(event.eventId))
    .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime));
}
