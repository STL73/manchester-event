import { Fragment } from "react";
import { Link } from "react-router-dom";
import { dashboardGreeting } from "../../data/dashboardGreetingData";
import { eventDetailsPath } from "../../data/eventsData";
import { getNextFavourite } from "../../lib/favourites";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// The status line's next saved event, or what to do without one
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
// event is approved. Pending is status "pending", as the sidebar badge and
// the admin Home count it, so the three agree
function PendingLine({ role, events, organiserEvents }) {
  const isPending = (event) => event.status === "pending";
  const counts = {
    pendingOwnEvents: organiserEvents.filter(isPending).length,
    pendingEvents: events.filter(isPending).length,
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

// Home's title row: the greeting and the account's picture in the logo's cell,
// and a status line where inner pages have their summary
export default function DashboardGreeting({ selectedUser, ...data }) {
  const Avatar = selectedUser.avatar;

  return (
    <header className="dashboard-greeting">
      <div className={`hex-frame dashboard-greeting-avatar ${selectedUser.avatarUrl ? "has-photo" : ""}`}>
        {selectedUser.avatarUrl ? (
          <img src={selectedUser.avatarUrl} alt="" />
        ) : (
          Avatar && <Avatar aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex flex-col gap-2">
        <h1 className="heading-page">
          {dashboardGreeting.title}{" "}
          <span className="dashboard-greeting-name">{selectedUser.user}</span>
        </h1>
        <p className="dashboard-greeting-status">
          {selectedUser.type === "user" ? (
            <NextFavouriteLine events={data.favouriteEvents} favouriteIds={data.favouriteIds} />
          ) : (
            <PendingLine role={dashboardGreeting.roles[selectedUser.type]} {...data} />
          )}
        </p>
      </div>
    </header>
  );
}
