import { useState } from "react";
import { CalendarCheck, ChartNoAxesColumn } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import StatusMessage from "../components/UI/StatusMessage";
import { eventDetailsPath } from "../data/eventsData";
import { eventState, statusLabel } from "../lib/eventStatus";
import { organiserInsights } from "../data/organiserDashboardData";
import {
  editEventPath,
  organiserCardActions,
  organiserEventActions,
  organiserEventMessages,
} from "../data/organiserEventsData";
import { bySoonest, isUpcoming } from "../lib/eventDates";
import EmptyState from "../components/UI/EmptyState";
import { countBy } from "../lib/analytics";
import { useApi } from "../lib/useApi";
import { daysSince, formatShortDay } from "../lib/formatDates";

// The oldest of a list by a date field, or undefined when it's empty
function oldest(events, getDate) {
  return [...events].sort((a, b) => getDate(a).localeCompare(getDate(b)))[0];
}

// The five Quick Insights cards, from the organiser's own events and the
// saves on them (GET /analytics/organiser, Phase 10; null until it answers,
// and `savesFailed` if it couldn't)
function getOrganiserInsights(events, saveRows, savesFailed) {
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

  const perEvent = countBy(saveRows ?? [], (save) => save.eventId);
  const savesOf = (eventId) => perEvent.find((row) => row.key === eventId)?.count ?? 0;
  const saves = live.map((event) => ({ event, count: savesOf(event.eventId) }));
  const totalSaves = saves.reduce((total, item) => total + item.count, 0);
  const mostSaved = [...saves].sort((a, b) => b.count - a.count)[0];

  return [
    {
      ...text.live,
      count: live.length,
      action: nextLive && {
        label: `${text.live.next} ${formatShortDay(nextLive.startDatetime)}`,
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
    // No figure until the server has answered, rather than a 0 that isn't true
    saveRows
      ? {
          ...text.saved,
          count: totalSaves,
          detail: totalSaves > 0 ? `${text.saved.mostSaved} ${mostSaved.event.name}` : text.saved.none,
        }
      : { ...text.saved, detail: savesFailed ? text.saved.loadError : text.saved.loading },
  ];
}

function newestFirst(a, b) {
  return b.createdAt.localeCompare(a.createdAt);
}

export default function OrganiserDashboardHome({ organiserEvents: events, onDeleteEvent }) {
  const [message, setMessage] = useState(null);
  const { createFirst } = organiserEventActions;

  // Matches get_recent_events()
  const recentEvents = [...events].sort(newestFirst).slice(0, 3);
  const { payload: analytics, error: analyticsError } = useApi("/analytics/organiser");
  const insights = getOrganiserInsights(events, analytics?.data.saves ?? null, Boolean(analyticsError));
  const now = new Date();

  // The card has already asked (see EventCard). The server may refuse: an
  // event approved since the page loaded can only be cancelled
  async function handleDelete(event) {
    setMessage(null);
    try {
      await onDeleteEvent(event.eventId);
      setMessage({ text: organiserEventMessages.eventDeleted });
    } catch (error) {
      setMessage({ text: error.message, variant: "error" });
    }
  }

  return (
    <div className="dashboard-page">
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
          <StatusMessage variant={message.variant} className="table-message">{message.text}</StatusMessage>
        )}

        <div className="events-grid events-grid-three">
          {recentEvents.length === 0 ? (
            <EmptyState icon={CalendarCheck} text={organiserEventMessages.noEvents}>
              <Button to={createFirst.to} variant="primary" size="md">
                <createFirst.icon aria-hidden="true" />
                {createFirst.label}
              </Button>
            </EmptyState>
          ) : (
            recentEvents.map((event) => {
              // Same buttons as on My Events, by what the event is now
              const state = eventState(event, now);
              const { canEdit, canDelete } = organiserCardActions(state, event);
              return (
                <EventCard
                  key={event.eventId}
                  event={event}
                  status={state}
                  statusLabel={statusLabel(state, "organiser")}
                  editTo={canEdit ? editEventPath(event.eventId) : undefined}
                  onDelete={canDelete ? handleDelete : undefined}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
