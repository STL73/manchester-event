import { CalendarHeart, CalendarSearch, ChartNoAxesColumn, Zap } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import { dashboardActions, dashboardInsights } from "../data/userDashboardData";
import { getFavouriteEvents } from "../data/myFavouritesData";

export default function UserDashboardHome({
  events,
  favouriteIds,
  onToggleFavourite,
}) {
  // Matches get_recent_favourites(): limit 3
  const recentFavourites = getFavouriteEvents(events, favouriteIds).slice(0, 3);

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
          {dashboardActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="quick-insights-title"
      >
        <h2 className="dashboard-title" id="quick-insights-title">
          <ChartNoAxesColumn className="dashboard-title-icon" aria-hidden="true" />
          Quick Insights
        </h2>
        <div className="dashboard-grid">
          {dashboardInsights.map((item) => (
            <DashboardCard
              key={item.title}
              item={
                item.id === "favourites"
                  ? { ...item, count: favouriteIds.length }
                  : item
              }
            />
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="recent-favourites-title"
      >
        <h2 className="dashboard-title" id="recent-favourites-title">
          <CalendarHeart className="dashboard-title-icon" aria-hidden="true" />
          Recent Favourites
        </h2>
        <div className="events-grid events-grid-three">
          {recentFavourites.length === 0 ? (
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
            recentFavourites.map((event) => (
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
