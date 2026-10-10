import { CalendarSearch, Heart } from "lucide-react";
import Button from "../components/UI/Button";
import EventCard from "../components/events/EventCard";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import {
  favouritesSummary,
  getFavouriteEvents,
  getNextFavourite,
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

// Favourites live in App so every page shows the same hearts
export default function MyFavourites({ events, favouriteIds, onToggleFavourite }) {
  const favourites = getFavouriteEvents(events, favouriteIds);

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
              count={favourites.length}
            />
          }
        />
        <div className="events-grid events-grid-three">
          {favourites.length === 0 ? (
            <div className="dashboard-empty-state">
              <p className="dashboard-empty-text">
                You do not have any favourite events yet.
              </p>
              <Button
                to="/dashboard/explore-events"
                variant="primary"
                size="md"
              >
                <CalendarSearch aria-hidden="true" />
                Explore Events
              </Button>
            </div>
          ) : (
            favourites.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                canFavourite
                isFavourite
                onToggleFavourite={onToggleFavourite}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
