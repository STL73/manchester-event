import { CalendarHeart, CalendarSearch, Heart, Zap } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import {
  favouritesInsight,
  getFavouriteEvents,
  myFavouritesActions,
} from "../data/myFavouritesData";

// Favourites live in App so every page shows the same hearts
export default function MyFavourites({ events, favouriteIds, onToggleFavourite }) {
  const favourites = getFavouriteEvents(events, favouriteIds);

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-actions-title"
      >
        <h2 className="dashboard-title" id="quick-actions-title">
          <Zap className="dashboard-title-icon" aria-hidden="true" />
          Quick Actions
        </h2>
        <div className="dashboard-actions">
          {myFavouritesActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="my-favourites-title"
      >
        <h2 className="dashboard-title" id="my-favourites-title">
          <Heart className="dashboard-title-icon" aria-hidden="true" />
          My Favourites
        </h2>
        <div className="dashboard-grid">
          <DashboardCard
            item={{ ...favouritesInsight, count: favourites.length }}
          />
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="favourite-events-title"
      >
        <h2 className="dashboard-title" id="favourite-events-title">
          <CalendarHeart className="dashboard-title-icon" aria-hidden="true" />
          Favourite Events
        </h2>
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
