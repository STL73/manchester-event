import { CalendarHeart, CalendarSearch, ChartNoAxesColumn } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import { userInsights } from "../data/userDashboardData";
import { getFavouriteEvents, getNextFavourite } from "../data/myFavouritesData";
import { eventCategories, eventDetailsPath, isPublicEvent } from "../data/eventsData";
import { allNotifications } from "../data/notificationsData";
import { isUpcoming, matchesWhen } from "../lib/eventDates";

const DAY = 24 * 60 * 60 * 1000;

const shortDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// The four Quick Insights cards: what's coming for this user, each with
// one line of context (see DashboardCard)
function getUserInsights({ events, favouriteIds, interestIds }) {
  const now = new Date();
  const text = userInsights;
  const live = events.filter((event) => isPublicEvent(event) && isUpcoming(event, now));
  const inInterests = live.filter((event) => interestIds.includes(event.categoryId));
  const hasInterests = interestIds.length > 0;

  const saved = live.filter((event) => favouriteIds.includes(event.eventId));
  const next = getNextFavourite(events, favouriteIds);

  const thisWeek = inInterests.filter((event) => matchesWhen(event, "week", now));
  const interestNames = eventCategories
    .filter((category) => interestIds.includes(category.id))
    .map((category) => category.name)
    .join(", ");

  // Approved in the last 7 days: the moment category_new_event is sent
  const newForYou = inInterests.filter(
    (event) => now - new Date(event.adminUpdatedAt) <= 7 * DAY,
  );

  // Notifications keep their read state on their own page for now, so this
  // counts the mock's unread flags
  const unread = allNotifications.filter(
    (notification) => notification.recipient === "user" && !notification.isRead,
  );

  return [
    {
      ...text.saved,
      count: saved.length,
      action: next && {
        label: `${text.saved.next} ${shortDate.format(new Date(next.startDatetime))}`,
        to: eventDetailsPath(next.eventId, true),
      },
      // An event already under way is saved but has no "next" date
      detail: saved.length === 0 ? text.saved.none : undefined,
    },
    {
      ...text.thisWeek,
      count: thisWeek.length,
      action: hasInterests ? undefined : text.thisWeek.noInterests,
      detail: interestNames,
    },
    {
      ...text.newForYou,
      count: newForYou.length,
      action: hasInterests ? text.newForYou.view : text.newForYou.noInterests,
      detail: text.newForYou.none,
    },
    {
      ...text.unread,
      count: unread.length,
      // allNotifications is newest first
      action: unread[0] && {
        label: `${text.unread.newest} ${dayMonth.format(new Date(unread[0].scheduledAt))}`,
        to: text.unread.to,
      },
      detail: text.unread.none,
    },
  ];
}

export default function UserDashboardHome({
  events,
  favouriteIds,
  interestIds,
  onToggleFavourite,
}) {
  // Matches get_recent_favourites(): limit 3
  const recentFavourites = getFavouriteEvents(events, favouriteIds).slice(0, 3);
  const insights = getUserInsights({ events, favouriteIds, interestIds });

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-insights-title"
      >
        <h2 className="dashboard-title" id="quick-insights-title">
          <ChartNoAxesColumn className="dashboard-title-icon" aria-hidden="true" />
          Quick Insights
        </h2>
        <div className="dashboard-grid">
          {insights.map((item) => (
            <DashboardCard key={item.title} item={item} />
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
