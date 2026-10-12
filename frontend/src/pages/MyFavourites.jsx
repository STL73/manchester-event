import { CalendarSearch, Heart } from "lucide-react";
import Button from "../components/UI/Button";
import EventCard from "../components/events/EventCard";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import { eventDetailsPath } from "../data/eventsData";
import { downloadEventIcs } from "../lib/calendar";
import EmptyState from "../components/UI/EmptyState";
import {
  endedFavourites,
  favouritesEmpty,
  favouritesSummary,
  getNextFavourite,
  splitFavourites,
} from "../data/myFavouritesData";

const nextDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

// "3 saved · next one Sun 18 Oct"; the date only when one is still to come
function FavouritesSummary({ events, favouriteIds, count }) {
  if (count === 0) return favouritesSummary.none;

  const next = getNextFavourite(events, favouriteIds);
  return (
    <>
      <strong>
        {count} {favouritesSummary.saved}
      </strong>
      {next && (
        <>
          <span aria-hidden="true"> · </span>
          {favouritesSummary.nextOne}{" "}
          {nextDateFormatter.format(new Date(next.startDatetime))}
        </>
      )}
    </>
  );
}

// The calendar entry links to the public event page
function addEventToCalendar(event) {
  downloadEventIcs(event, `${window.location.origin}${eventDetailsPath(event.eventId, false)}`);
}

// Favourites live in App so every page shows the same hearts
export default function MyFavourites({ events, favouriteIds, onToggleFavourite }) {
  const { upcoming, ended } = splitFavourites(events, favouriteIds, new Date());
  const EndedIcon = endedFavourites.icon;

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="my-favourites-title"
      >
        <DashboardPageHeading
          id="my-favourites-title"
          icon={Heart}
          title="My Favourites"
          summary={
            <FavouritesSummary
              events={events}
              favouriteIds={favouriteIds}
              count={upcoming.length + ended.length}
            />
          }
        />
        <div className="events-grid events-grid-three">
          {upcoming.length === 0 ? (
            <EmptyState icon={Heart} text={ended.length === 0 ? favouritesEmpty.none : favouritesEmpty.noneUpcoming}>
              <Button
                to="/dashboard/explore-events"
                variant="primary"
                size="md"
              >
                <CalendarSearch aria-hidden="true" />
                Explore Events
              </Button>
            </EmptyState>
          ) : (
            upcoming.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                canFavourite
                isFavourite
                onToggleFavourite={onToggleFavourite}
                onAddToCalendar={addEventToCalendar}
              />
            ))
          )}
        </div>
      </section>

      {/* Kept, greyed and labelled, as the schema agreed; the heart still
          removes them */}
      {ended.length > 0 && (
        <section
          className="dashboard-section"
          aria-labelledby="ended-favourites-title"
        >
          <h2 className="dashboard-title" id="ended-favourites-title">
            <EndedIcon className="dashboard-title-icon" aria-hidden="true" />
            {endedFavourites.title}
          </h2>
          <div className="events-grid events-grid-three">
            {ended.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                status={event.status === "cancelled" ? "cancelled" : "past"}
                muted
                canFavourite
                isFavourite
                onToggleFavourite={onToggleFavourite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
