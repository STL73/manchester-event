import { useState } from "react";
import { CalendarCheck, ChartNoAxesColumn } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import EventCard from "../components/events/EventCard";
import StatusMessage from "../components/UI/StatusMessage";
import {
  lastCreatedInsight,
  nextEventInsight,
  statusInsights,
} from "../data/organiserDashboardData";
import {
  editEventPath,
  organiserEventActions,
  organiserEventMessages,
} from "../data/organiserEventsData";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function newestFirst(a, b) {
  return b.createdAt.localeCompare(a.createdAt);
}

export default function OrganiserDashboardHome({ organiserEvents: events, onDeleteEvent }) {
  const [message, setMessage] = useState("");
  const { createFirst } = organiserEventActions;

  // Matches get_last_created_event(), get_next_event() and get_recent_events()
  const byNewest = [...events].sort(newestFirst);
  const lastCreated = byNewest[0];
  const now = new Date();
  const nextEvent = events
    .filter((event) => new Date(event.startDatetime) > now)
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))[0];
  const recentEvents = byNewest.slice(0, 3);

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
        <div className="dashboard-insights">
          <div className="dashboard-grid dashboard-grid-three">
            {statusInsights.map((item) => (
              <DashboardCard
                key={item.status}
                item={{
                  ...item,
                  count: events.filter((event) => event.status === item.status)
                    .length,
                }}
              />
            ))}
          </div>
          <div className="dashboard-grid dashboard-grid-two">
            <DashboardCard
              item={{
                ...lastCreatedInsight,
                value: lastCreated?.name ?? lastCreatedInsight.emptyValue,
                detail: lastCreated
                  ? `Created: ${dayFormatter.format(new Date(lastCreated.createdAt))}`
                  : "--",
              }}
            />
            <DashboardCard
              item={{
                ...nextEventInsight,
                value: nextEvent?.name ?? nextEventInsight.emptyValue,
                detail: nextEvent
                  ? dateTimeFormatter.format(new Date(nextEvent.startDatetime))
                  : "--",
              }}
            />
          </div>
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
