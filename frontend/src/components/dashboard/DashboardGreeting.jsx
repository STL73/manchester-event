import { Fragment } from "react";
import { Link } from "react-router-dom";
import { dashboardGreeting } from "../../data/dashboardGreetingData";
import { eventDetailsPath } from "../../data/eventsData";
import { getNextFavourite } from "../../data/myFavouritesData";
import { getSiteTotals } from "../../lib/analytics";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

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
// event is approved. No unverified users here: only they can verify
function PendingLine({ role, users, events, organiserEvents }) {
  const { pendingEvents } = getSiteTotals(users, events);
  const counts = {
    pendingOwnEvents: organiserEvents.filter((event) => event.status === "pending")
      .length,
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

// Home's title row: the greeting where inner pages have their title, and
// the status line where they have their summary. No shortcuts: the sidebar
// already links every page, and the status line and cards link to what
// needs attention (changed 2026-10-10; the PHP had a Quick Actions block)
// The picture sits in the logo's cell, Home's own hexagon where inner pages
// have their title icon; without one, the sidebar's default icon
export default function DashboardGreeting({ selectedUser, ...data }) {
  const Avatar = selectedUser.avatar;

  return (
    <header className="dashboard-greeting">
      <div className={`dashboard-greeting-avatar ${selectedUser.avatarUrl ? "has-photo" : ""}`}>
        {selectedUser.avatarUrl ? (
          <img src={selectedUser.avatarUrl} alt="" />
        ) : (
          Avatar && <Avatar aria-hidden="true" />
        )}
      </div>
      <div className="dashboard-greeting-text">
        <h1 className="dashboard-greeting-title">
          {dashboardGreeting.title}{" "}
          <span className="dashboard-greeting-name">{selectedUser.user}</span>
        </h1>
        <p className="dashboard-greeting-status">
          {selectedUser.type === "user" ? (
            <NextFavouriteLine events={data.events} favouriteIds={data.favouriteIds} />
          ) : (
            <PendingLine role={dashboardGreeting.roles[selectedUser.type]} {...data} />
          )}
        </p>
      </div>
    </header>
  );
}
