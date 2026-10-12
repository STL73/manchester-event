import { Fragment, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowDownUp, CalendarCheck, CalendarDays, X } from "lucide-react";
import Button from "../components/UI/Button";
import EventCard from "../components/events/EventCard";
import SearchBar from "../components/events/SearchBar";
import StatusMessage from "../components/UI/StatusMessage";
import Pagination from "../components/UI/Pagination";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import { eventCategories, eventLocations, eventState } from "../data/eventsData";
import EmptyState from "../components/UI/EmptyState";
import {
  myEventsActions,
  myEventsDate,
  myEventsMessages,
  myEventsPageSize,
  myEventsPaging,
  myEventsSummary,
  sortLabel,
  sortOptions,
  statusViews,
} from "../data/myEventsData";
import {
  editEventPath,
  organiserCardActions,
  organiserEventActions,
  organiserEventMessages,
  organiserStatusLabels,
} from "../data/organiserEventsData";

// The search bar's fields, the same bar as Explore Events: they apply on
// Search, like the PHP GET form. Status and sort sit in the row under it
// and apply at once
const defaultFilters = {
  category: "",
  location: "",
  q: "",
};

function readFilters(searchParams) {
  return Object.fromEntries(
    Object.entries(defaultFilters).map(([key, fallback]) => [
      key,
      searchParams.get(key) ?? fallback,
    ]),
  );
}

const chipDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

// Matches the ORDER BY options in get_organiser_events()
const sorters = {
  newest: (a, b) => b.startDatetime.localeCompare(a.startDatetime),
  oldest: (a, b) => a.startDatetime.localeCompare(b.startDatetime),
  az: (a, b) => a.name.localeCompare(b.name),
  za: (a, b) => b.name.localeCompare(a.name),
};

// "7 live · 2 waiting for approval · 1 rejected · 3 drafts"; only the parts
// with something in them
function Summary({ counts, draftCount }) {
  const { parts, drafts, none } = myEventsSummary;
  const shown = parts.filter((part) => counts[part.state] > 0);

  if (shown.length === 0 && draftCount === 0) return none;

  return (
    <>
      {shown.map((part, index) => (
        <Fragment key={part.state}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          <strong>{counts[part.state]}</strong> {part.text}
        </Fragment>
      ))}
      {draftCount > 0 && (
        <>
          {shown.length > 0 && <span aria-hidden="true"> · </span>}
          <Link to={drafts.to} className="dashboard-greeting-link">
            {draftCount} {draftCount === 1 ? drafts.one : drafts.many}
          </Link>
        </>
      )}
    </>
  );
}

export default function MyEvents({ organiserEvents, onDeleteEvent }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  // A message can arrive from Edit Event (e.g. after cancelling an event)
  const location = useLocation();
  const [message, setMessage] = useState(location.state?.message ?? "");
  const gridRef = useRef(null);
  const dateInputRef = useRef(null);
  const { createFirst } = organiserEventActions;

  // Drafts live on My Drafts; everything here has been submitted. Each
  // event carries its state, so past is worked out from the dates
  const submitted = useMemo(() => {
    const now = new Date();
    return organiserEvents
      .filter((event) => event.status !== "draft")
      .map((event) => ({ event, state: eventState(event, now) }));
  }, [organiserEvents]);
  const draftCount = organiserEvents.length - submitted.length;

  const counts = submitted.reduce(
    (totals, { state }) => ({ ...totals, [state]: (totals[state] ?? 0) + 1 }),
    { all: submitted.length },
  );

  const statusParam = searchParams.get("status");
  const status = statusViews.options.some((option) => option.value === statusParam)
    ? statusParam
    : "all";
  // An exact day, any day: unlike Explore, past ones too
  const dateParam = searchParams.get("date") ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : "";
  const sortParam = searchParams.get("sort");
  const sort = sortParam in sorters ? sortParam : "newest";

  const filteredEvents = useMemo(() => {
    const applied = readFilters(searchParams);
    const query = applied.q.trim().toLowerCase();
    const sorter = sorters[sort];

    return submitted
      .filter(({ event, state }) => {
        const searchableText =
          `${event.name} ${event.description ?? ""}`.toLowerCase();

        return (
          (status === "all" || state === status) &&
          (!date || event.startDatetime.slice(0, 10) === date) &&
          (!applied.category || event.categoryId === applied.category) &&
          (!applied.location || event.locationId === applied.location) &&
          (!query || searchableText.includes(query))
        );
      })
      .sort((a, b) => sorter(a.event, b.event));
  }, [submitted, searchParams, status, sort, date]);

  // The page lives in the URL, as on Explore Events; out-of-range numbers clamp
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / myEventsPageSize));
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * myEventsPageSize;
  const pageEvents = filteredEvents.slice(firstIndex, firstIndex + myEventsPageSize);

  // Only statuses the organiser has, plus All and whichever is selected
  const statusOptions = statusViews.options
    .filter((option) => option.value === "all" || counts[option.value] > 0 || option.value === status)
    .map((option) => ({
      value: option.value,
      label: (
        <>
          {option.label} <span className="events-when-count">{counts[option.value] ?? 0}</span>
        </>
      ),
    }));

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  // A new search starts at page 1 and keeps the status, date and sort
  function handleFilterSubmit(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams();

    if (status !== "all") nextParams.set("status", status);
    if (sort !== "newest") nextParams.set("sort", sort);
    if (date) nextParams.set("date", date);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key]) nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  function handleDateChange(nextDate) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextDate) nextParams.set("date", nextDate);
    else nextParams.delete("date");
    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function handleSortChange(event) {
    const nextParams = new URLSearchParams(searchParams);
    if (event.target.value === "newest") nextParams.delete("sort");
    else nextParams.set("sort", event.target.value);
    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function handleStatusChange(nextStatus) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus === "all") nextParams.delete("status");
    else nextParams.set("status", nextStatus);
    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function handlePageChange(nextPage) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    else nextParams.delete("page");
    setSearchParams(nextParams);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gridRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchParams({});
  }

  // The card has already asked (see EventCard)
  function handleDelete(event) {
    onDeleteEvent(event.eventId);
    setMessage(organiserEventMessages.eventDeleted);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="my-events-title"
      >
        <DashboardPageHeading
          id="my-events-title"
          icon={CalendarCheck}
          title="My Events"
          actions={myEventsActions}
          summary={<Summary counts={counts} draftCount={draftCount} />}
        />

        {submitted.length > 0 && (
          <>
            <SearchBar
              filters={filters}
              categories={eventCategories}
              locations={eventLocations}
              onChange={handleFilterChange}
              onSubmit={handleFilterSubmit}
              showDate={false}
              className="events-search-no-date"
            />

            {/* Where Explore has its date pills and view switcher */}
            <div className="events-when-row">
              <div className="events-when" role="group" aria-label={statusViews.label}>
                {statusOptions.map((option) => (
                  <button
                    className={`events-when-option ${status === option.value ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={status === option.value}
                    onClick={() => handleStatusChange(option.value)}
                    key={option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {/* A second filter beside the sort, apart from the status pills
                  so it reads as "and", not one more status */}
              <div className="events-when-tools">
                <span className="events-when-date">
                  <button
                    className={`events-when-option ${date ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={Boolean(date)}
                    onClick={openDatePicker}
                  >
                    <CalendarDays aria-hidden="true" />
                    {date ? chipDate.format(new Date(`${date}T00:00:00`)) : myEventsDate.pick}
                  </button>
                  <input
                    ref={dateInputRef}
                    className="events-when-date-input"
                    type="date"
                    value={date}
                    onChange={(event) => handleDateChange(event.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </span>
                {date && (
                  <button
                    className="events-when-clear"
                    type="button"
                    aria-label={myEventsDate.clear}
                    onClick={() => handleDateChange("")}
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
                <label className="toolbar-select">
                  <span className="sr-only">{sortLabel}</span>
                  <ArrowDownUp aria-hidden="true" />
                  <select value={sort} onChange={handleSortChange}>
                    {sortOptions.map(({ value, label }) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </>
        )}

        {message && (
          <StatusMessage className="table-message">{message}</StatusMessage>
        )}

        <div className="events-grid events-grid-three" ref={gridRef}>
          {submitted.length === 0 ? (
            <EmptyState icon={CalendarCheck} text={organiserEventMessages.noEvents}>
              <Button to={createFirst.to} variant="primary" size="md">
                <createFirst.icon aria-hidden="true" />
                {createFirst.label}
              </Button>
            </EmptyState>
          ) : filteredEvents.length === 0 ? (
            <EmptyState icon={CalendarCheck} text={myEventsMessages.noMatches}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearFilters}
              >
                {myEventsMessages.clearFilters}
              </Button>
            </EmptyState>
          ) : (
            pageEvents.map(({ event, state }) => {
              const { canEdit, canDelete } = organiserCardActions(state, event);
              return (
                <EventCard
                  key={event.eventId}
                  event={event}
                  status={state}
                  statusLabel={organiserStatusLabels[state]}
                  muted={state === "past" || state === "cancelled"}
                  editTo={canEdit ? editEventPath(event.eventId) : undefined}
                  onDelete={canDelete ? handleDelete : undefined}
                />
              );
            })
          )}
        </div>

        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          summary={myEventsPaging.showing(
            firstIndex + 1,
            firstIndex + pageEvents.length,
            filteredEvents.length,
          )}
        />
      </section>
    </div>
  );
}
