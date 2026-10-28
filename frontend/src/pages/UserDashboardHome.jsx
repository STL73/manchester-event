import { CalendarHeart, CalendarSearch, ChartNoAxesColumn } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import { userInsights } from "../data/userDashboardData";
import { getFavouriteEvents, getNextFavourite } from "../data/myFavouritesData";
import { eventCategories, eventDetailsPath, isPublicEvent } from "../data/eventsData";
import { isUpcoming } from "../lib/eventDates";
import { eventsPath } from "../lib/publicEvents";
import { useApi } from "../lib/useApi";
import EmptyState from "../components/UI/EmptyState";

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
// one line of context (see DashboardCard). Saved events are the user's real
// favourites and "This week" counts real events (Phase 4); "New in your
// interests" reads the mock events until notifications arrive in Phase 7
function getUserInsights({ events, favouriteEvents, favouriteIds, interestIds, thisWeekCount, notifications }) {
  const now = new Date();
  const text = userInsights;
  const live = events.filter((event) => isPublicEvent(event) && isUpcoming(event, now));
  const inInterests = live.filter((event) => interestIds.includes(event.categoryId));
  const hasInterests = interestIds.length > 0;

  const saved = favouriteEvents.filter(
    (event) => favouriteIds.includes(event.eventId) && isPublicEvent(event) && isUpcoming(event, now),
  );
  const next = getNextFavourite(favouriteEvents, favouriteIds);

  const interestNames = eventCategories
    .filter((category) => interestIds.includes(category.id))
    .map((category) => category.name)
    .join(", ");

  // Approved in the last 7 days: the moment category_new_event is sent
  const newForYou = inInterests.filter(
    (event) => now - new Date(event.adminUpdatedAt) <= 7 * DAY,
  );

  const unread = notifications.filter(
    (notification) => notification.recipient === "user" && !notification.readAt,
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
      count: thisWeekCount,
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
      // App keeps notifications newest first
      action: unread[0] && {
        label: `${text.unread.newest} ${dayMonth.format(new Date(unread[0].createdAt))}`,
        to: text.unread.to,
      },
      detail: text.unread.none,
    },
  ];
}

export default function UserDashboardHome({
  events,
  favouriteEvents,
  favouriteIds,
  interestIds,
  notifications,
  onToggleFavourite,
}) {
  // Matches get_recent_favourites(): limit 3
  const recentFavourites = getFavouriteEvents(favouriteEvents, favouriteIds).slice(0, 3);
  // Only the total is needed, so one event is asked for. Sorted, so the same
  // interests always ask for the same thing
  const thisWeek = useApi(
    interestIds.length > 0
      ? eventsPath({ category: [...interestIds].sort(), when: "week", limit: 1 })
      : null,
  );
  // "…" while it loads and "–" if it can't, rather than a 0 that isn't true
  const thisWeekCount =
    interestIds.length === 0 ? 0 : thisWeek.error ? "–" : (thisWeek.payload?.pagination.total ?? "…");
  const insights = getUserInsights({
    events,
    favouriteEvents,
    favouriteIds,
    interestIds,
    thisWeekCount,
    notifications,
  });

  return (
    <div className="dashboard-page">
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
            <EmptyState icon={CalendarHeart} text="You do not have any favourite events yet.">
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
