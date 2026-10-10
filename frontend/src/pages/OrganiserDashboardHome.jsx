import { useState } from "react";
import { CalendarCheck, ChartNoAxesColumn } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import StatusMessage from "../components/UI/StatusMessage";
import { eventDetailsPath } from "../data/eventsData";
import { favouriteCounts } from "../data/myFavouritesData";
import { organiserInsights } from "../data/organiserDashboardData";
import {
  editEventPath,
  organiserEventActions,
  organiserEventMessages,
} from "../data/organiserEventsData";
import { bySoonest, isUpcoming } from "../lib/eventDates";

const DAY = 24 * 60 * 60 * 1000;

const shortDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function daysSince(date, now) {
  return Math.floor((now - new Date(date)) / DAY);
}

// The oldest of a list by a date field, or undefined when it's empty
function oldest(events, getDate) {
  return [...events].sort((a, b) => getDate(a).localeCompare(getDate(b)))[0];
}

// The five Quick Insights cards, from the organiser's own events
function getOrganiserInsights(events) {
  const now = new Date();
  const text = organiserInsights;
  const byStatus = (status) => events.filter((event) => event.status === status);

  const live = byStatus("approved")
    .filter((event) => isUpcoming(event, now))
    .sort(bySoonest);
  const nextLive = live.find((event) => new Date(event.startDatetime) > now);

  // Sent for review = the organiser's last edit, or creation if never edited
  const pending = byStatus("pending");
  const sentAt = (event) => event.orgUpdatedAt ?? event.createdAt;
  const oldestPending = oldest(pending, sentAt);

  const drafts = byStatus("draft");
  const oldestDraft = oldest(drafts, (event) => event.createdAt);

  const saves = live.map((event) => ({ event, count: favouriteCounts[event.eventId] ?? 0 }));
  const totalSaves = saves.reduce((total, item) => total + item.count, 0);
  const mostSaved = [...saves].sort((a, b) => b.count - a.count)[0];

  return [
    {
      ...text.live,
      count: live.length,
      action: nextLive && {
        label: `${text.live.next} ${shortDate.format(new Date(nextLive.startDatetime))}`,
        to: eventDetailsPath(nextLive.eventId, true),
      },
      detail: live.length === 0 ? text.live.none : undefined,
    },
    {
      ...text.pending,
      count: pending.length,
      action: oldestPending && {
        label: text.pending.oldest(daysSince(sentAt(oldestPending), now)),
        to: text.pending.to,
      },
      detail: text.pending.none,
    },
    {
      ...text.rejected,
      count: byStatus("rejected").length,
      detail: text.rejected.none,
    },
    {
      ...text.drafts,
      count: drafts.length,
      action: oldestDraft && {
        label: text.drafts.oldest(daysSince(oldestDraft.createdAt, now)),
        to: text.drafts.to,
      },
      detail: text.drafts.none,
    },
    {
      ...text.saved,
      count: totalSaves,
      detail:
        totalSaves > 0
          ? `${text.saved.mostSaved} ${mostSaved.event.name}`
          : text.saved.none,
    },
  ];
}

function newestFirst(a, b) {
  return b.createdAt.localeCompare(a.createdAt);
}

export default function OrganiserDashboardHome({ organiserEvents: events, onDeleteEvent }) {
  const [message, setMessage] = useState("");
  const { createFirst } = organiserEventActions;

  // Matches get_recent_events()
  const recentEvents = [...events].sort(newestFirst).slice(0, 3);
  const insights = getOrganiserInsights(events);

  function handleDelete(event) {
    if (!window.confirm(organiserEventMessages.confirmDelete)) return;
    onDeleteEvent(event.eventId);
    setMessage(organiserEventMessages.eventDeleted);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-insights-title"
      >
        <h2 className="dashboard-title" id="quick-insights-title">
          <ChartNoAxesColumn
            className="dashboard-title-icon"
            aria-hidden="true"
          />
          Quick Insights
        </h2>
        <div className="dashboard-grid dashboard-grid-five">
          {insights.map((item) => (
            <DashboardCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="recent-events-title"
      >
        <h2 className="dashboard-title" id="recent-events-title">
          <CalendarCheck className="dashboard-title-icon" aria-hidden="true" />
          Recent Events
        </h2>

        {message && (
          <StatusMessage className="table-message">{message}</StatusMessage>
        )}

        <div className="events-grid events-grid-three">
          {recentEvents.length === 0 ? (
            <div className="dashboard-empty-state">
              <p className="dashboard-empty-text">
                {organiserEventMessages.noEvents}
              </p>
              <Button to={createFirst.to} variant="primary" size="md">
                <createFirst.icon aria-hidden="true" />
                {createFirst.label}
              </Button>
            </div>
          ) : (
            recentEvents.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                status={event.status}
                editTo={editEventPath(event.eventId)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
