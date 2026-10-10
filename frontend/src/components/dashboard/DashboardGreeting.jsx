import { Fragment } from "react";
import { Link } from "react-router-dom";
import { dashboardGreeting } from "../../data/dashboardGreetingData";
import { eventDetailsPath, isPublicEvent } from "../../data/eventsData";
import { getSiteTotals } from "../../lib/analytics";
import DashboardShortcuts from "./DashboardShortcuts";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Soonest approved favourite that has not started yet
function getNextFavourite(events, favouriteIds) {
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

function NextFavouriteLine({ events, favouriteIds }) {
  const text = dashboardGreeting.nextFavourite;
  const event = getNextFavourite(events, favouriteIds);

  if (!event) {
    return (
      <>
        {text.none}{" "}
        <Link to={text.explore.url} className="dashboard-greeting-link">
          {text.explore.label}
        </Link>
      </>
    );
  }

  return (
    <>
      {text.intro}{" "}
      <Link
        to={eventDetailsPath(event.eventId, true)}
        state={{ from: text.from }}
        className="dashboard-greeting-link"
      >
        {event.name}
      </Link>{" "}
      {text.on} {dateFormatter.format(new Date(event.startDatetime))}.
    </>
  );
}

// Counted live from the shared state, so the line changes as soon as an
// event is approved or a user is activated
function PendingLine({ role, users, events, organiserEvents }) {
  const { pendingUsers, pendingEvents } = getSiteTotals(users, events);
  const counts = {
    pendingOwnEvents: organiserEvents.filter((event) => event.status === "pending")
      .length,
    pendingUsers,
    pendingEvents,
  };
  const items = (role?.items ?? []).filter((item) => counts[item.id] > 0);

  if (items.length === 0) {
    return dashboardGreeting.allCaughtUp;
  }

  return (
    <>
      {dashboardGreeting.intro}{" "}
      {items.map((item, index) => {
        const count = counts[item.id];
        return (
          <Fragment key={item.id}>
            {index > 0 && " and "}
            <Link to={item.url} className="dashboard-greeting-link">
              {count} {count === 1 ? item.singular : item.plural}
            </Link>
          </Fragment>
        );
      })}{" "}
      {role.suffix}.
    </>
  );
}

// Home's title row: the greeting where inner pages have their title, with
// the same shortcuts beside it
export default function DashboardGreeting({ selectedUser, actions, ...data }) {
  return (
    // Shortcuts last, so a narrow screen keeps the status line under the
    // greeting; App.css moves them up beside it when there is room
    <header className="dashboard-greeting">
      <h2 className="dashboard-greeting-title">
        {dashboardGreeting.title}{" "}
        <span className="dashboard-greeting-name">{selectedUser.user}</span>
      </h2>
      <p className="dashboard-greeting-status">
        {selectedUser.type === "user" ? (
          <NextFavouriteLine events={data.events} favouriteIds={data.favouriteIds} />
        ) : (
          <PendingLine role={dashboardGreeting.roles[selectedUser.type]} {...data} />
        )}
      </p>
      <DashboardShortcuts actions={actions} />
    </header>
  );
}
