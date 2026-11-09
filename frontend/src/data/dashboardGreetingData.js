// Home's greeting and status line: a user's next favourite, or what is waiting
// for an organiser or admin ("2 users and 1 event"), leaving out counts of 0
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
          id: "pendingEvents",
          url: "/dashboard/manage-events",
          singular: "event",
          plural: "events",
        },
      ],
    },
  },
};
