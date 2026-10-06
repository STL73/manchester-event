import { useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CalendarCheck, Zap } from "lucide-react";
import Button from "../components/UI/Button";
import EventCard from "../components/events/EventCard";
import SearchBar from "../components/events/SearchBar";
import StatusMessage from "../components/UI/StatusMessage";
import { eventCategories, eventLocations } from "../data/eventsData";
import {
  applyFiltersAction,
  myEventsActions,
  myEventsFilterIntro,
  myEventsMessages,
  sortOptions,
  statusFilterOptions,
} from "../data/myEventsData";
import {
  editEventPath,
  organiserEventActions,
  organiserEventMessages,
} from "../data/organiserEventsData";

const defaultFilters = {
  date: "",
  category: "",
  location: "",
  q: "",
  status: "all",
  sort: "newest",
};

function readFilters(searchParams) {
  return Object.fromEntries(
    Object.entries(defaultFilters).map(([key, fallback]) => [
      key,
      searchParams.get(key) ?? fallback,
    ]),
  );
}

// Matches the ORDER BY options in get_organiser_events()
const sorters = {
  newest: (a, b) => b.startDatetime.localeCompare(a.startDatetime),
  oldest: (a, b) => a.startDatetime.localeCompare(b.startDatetime),
  az: (a, b) => a.name.localeCompare(b.name),
  za: (a, b) => b.name.localeCompare(a.name),
};

export default function MyEvents({ organiserEvents, onDeleteEvent }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  // A message can arrive from Edit Event (e.g. after cancelling an event)
  const location = useLocation();
  const [message, setMessage] = useState(location.state?.message ?? "");
  const { createFirst } = organiserEventActions;

  // Filters apply when the form is submitted, like the PHP GET form
  const filteredEvents = useMemo(() => {
    const applied = readFilters(searchParams);
    const query = applied.q.trim().toLowerCase();
    const sorter = sorters[applied.sort] ?? sorters.newest;

    return organiserEvents
      .filter((event) => {
        const searchableText =
          `${event.name} ${event.description ?? ""}`.toLowerCase();

        return (
          (applied.status === "all" || event.status === applied.status) &&
          (!applied.date || event.startDatetime.slice(0, 10) === applied.date) &&
          (!applied.category || event.categoryId === applied.category) &&
          (!applied.location || event.locationId === applied.location) &&
          (!query || searchableText.includes(query))
        );
      })
      .sort(sorter);
  }, [organiserEvents, searchParams]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key]) nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchParams({});
  }

  function handleDelete(event) {
    if (!window.confirm(organiserEventMessages.confirmDelete)) return;
    onDeleteEvent(event.eventId);
    setMessage(organiserEventMessages.eventDeleted);
  }

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
          {myEventsActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="my-events-title"
      >
        <h2 className="dashboard-title" id="my-events-title">
          <CalendarCheck className="dashboard-title-icon" aria-hidden="true" />
          My Events
        </h2>

        <div className="filter-panel">
          <p className="content-p">{myEventsFilterIntro}</p>
          <SearchBar
            className="events-search-wide"
            filters={filters}
            categories={eventCategories}
            locations={eventLocations}
            onChange={handleFilterChange}
            onSubmit={handleFilterSubmit}
            submitLabel={applyFiltersAction.label}
            submitIcon={applyFiltersAction.icon}
          >
            <label className="sr-only" htmlFor="event-status">
              Status
            </label>
            <select
              id="event-status"
              name="status"
              value={filters.status}
              className="events-search-input"
              onChange={handleFilterChange}
            >
              {statusFilterOptions.map(({ value, label }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="event-sort">
              Sort
            </label>
            <select
              id="event-sort"
              name="sort"
              value={filters.sort}
              className="events-search-input"
              onChange={handleFilterChange}
            >
              {sortOptions.map(({ value, label }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </SearchBar>
        </div>

        {message && (
          <StatusMessage className="table-message">{message}</StatusMessage>
        )}

        <div className="events-grid events-grid-three">
          {organiserEvents.length === 0 ? (
            <div className="dashboard-empty-state">
              <p className="dashboard-empty-text">
                {organiserEventMessages.noEvents}
              </p>
              <Button to={createFirst.to} variant="primary" size="md">
                <createFirst.icon aria-hidden="true" />
                {createFirst.label}
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="dashboard-empty-state">
              <p className="dashboard-empty-text">
                {myEventsMessages.noMatches}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearFilters}
              >
                {myEventsMessages.clearFilters}
              </Button>
            </div>
          ) : (
            filteredEvents.map((event) => (
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
