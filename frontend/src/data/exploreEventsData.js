import { Bell, CalendarSearch, Heart, Settings2 } from "lucide-react";

// Public /events page intro (signed-out)
export const publicIntro = {
  title: "Explore All Events in Manchester Area",
  paragraphs: [
    "Discover a variety of events happening around Manchester. From music festivals to art exhibitions, there is something for everyone. Whether you are looking for family-friendly activities or nightlife events, our platform has you covered.",
    "Check out the latest events, add them as favourites, and share your experiences with others. Use the search bar below to filter events by date, category, location, or keywords.",
  ],
};

// Dashboard version: Quick Actions from explore_events.php
export const exploreEventsActions = [
  { label: "My Favourites", to: "/dashboard/my-favourites", icon: Heart },
  { label: "Update Preferences", to: "/dashboard/preferences", icon: Settings2 },
  { label: "View Notifications", to: "/dashboard/notifications", icon: Bell },
];

export const exploreEventsSection = {
  title: "Explore Events",
  icon: CalendarSearch,
};
