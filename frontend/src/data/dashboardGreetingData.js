// Dashboard home greeting. Replaces the role paragraphs of dashboard_greeting.php
// with one live status line. Users see their next favourite event (the Quick
// Insights card below already shows how many favourites they have); organisers
// and admins see what is waiting: "You have 2 users and 1 event waiting for
// your review." Items with a count of 0 are left out.
export const dashboardGreeting = {
  title: "Welcome back,",
  intro: "You have",
  allCaughtUp: "You're all caught up.",
  nextFavourite: {
    intro: "Your next favourite event is",
    on: "on",
    none: "You have no upcoming favourite events.",
    explore: { label: "Explore events", url: "/dashboard/explore-events" },
    // The sidebar keeps My Favourites highlighted on the event page
    from: "/dashboard/my-favourites",
  },
  roles: {
    organiser: {
      suffix: "waiting for approval",
      items: [
        {
          id: "pendingOwnEvents",
          url: "/dashboard/my-events",
          singular: "event",
          plural: "events",
        },
      ],
    },
    admin: {
      suffix: "waiting for your review",
      items: [
        {
          id: "pendingUsers",
          url: "/dashboard/manage-users",
          singular: "user",
          plural: "users",
        },
        {
          id: "pendingEvents",
          url: "/dashboard/manage-events",
          singular: "event",
          plural: "events",
        },
      ],
    },
  },
};
