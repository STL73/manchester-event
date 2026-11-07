import { CalendarHeart, CalendarSearch } from "lucide-react";
import Button from "../components/UI/Button";
import QuickInsights from "../components/dashboard/QuickInsights";
import EventCard from "../components/events/EventCard";
import { userInsights } from "../data/userDashboardData";
import { getFavouriteEvents, getNextFavourite } from "../lib/favourites";
import { eventCategories, eventDetailsPath } from "../data/eventsData";
import { isPublicEvent } from "../lib/eventStatus";
import { isUpcoming } from "../lib/eventDates";
import { eventsPath } from "../lib/publicEvents";
import { useApi } from "../lib/useApi";
import EmptyState from "../components/UI/EmptyState";
import { DAY, formatDayMonth, formatShortDay } from "../lib/formatDates";

// The four Quick Insights cards: what's coming for this user, each with
// one line of context (see DashboardCard). Saved events are the user's real
// favourites and "This week" counts real events (Phase 4); "New in your
// interests" counts the category_new_event notifications (Phase 7)
function getUserInsights({ favouriteEvents, favouriteIds, interestIds, thisWeekCount, notifications }) {
  const now = new Date();
  const text = userInsights;
  const hasInterests = interestIds.length > 0;

  const saved = favouriteEvents.filter(
    (event) => favouriteIds.includes(event.eventId) && isPublicEvent(event) && isUpcoming(event, now),
  );
  const next = getNextFavourite(favouriteEvents, favouriteIds);

  const interestNames = eventCategories
    .filter((category) => interestIds.includes(category.id))
    .map((category) => category.name)
    .join(", ");

  // Sent when an event in a followed category is first approved; one event
  // counts once, and only while Explore still shows it (`listed`), since
  // View leads there
  const newForYou = new Set(
    notifications
      .filter(
        (notification) =>
          notification.type === "category_new_event" &&
          notification.listed &&
          now - new Date(notification.createdAt) <= 7 * DAY,
      )
      .map((notification) => notification.eventId),
  );

  const unread = notifications.filter((notification) => !notification.readAt);

  return [
    {
      ...text.saved,
      count: saved.length,
      action: next && {
        label: `${text.saved.next} ${formatShortDay(next.startDatetime)}`,
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
      count: newForYou.size,
      action: hasInterests ? text.newForYou.view : text.newForYou.noInterests,
      detail: text.newForYou.none,
    },
    {
      ...text.unread,
      count: unread.length,
      // App keeps notifications newest first
      action: unread[0] && {
        label: `${text.unread.newest} ${formatDayMonth(unread[0].createdAt)}`,
        to: text.unread.to,
      },
      detail: text.unread.none,
    },
  ];
}

export default function UserDashboardHome({
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
    favouriteEvents,
    favouriteIds,
    interestIds,
    thisWeekCount,
    notifications,
  });

  return (
    <div className="dashboard-page">
      <QuickInsights insights={insights} />

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
