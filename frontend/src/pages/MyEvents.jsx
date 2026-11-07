import { Fragment, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CalendarDays, X } from "lucide-react";
import FilterPills from "../components/UI/FilterPills";
import SortSelect from "../components/UI/SortSelect";
import Button from "../components/UI/Button";
import EventCard from "../components/events/EventCard";
import SearchBar from "../components/events/SearchBar";
import StatusMessage from "../components/UI/StatusMessage";
import Pagination from "../components/UI/Pagination";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import { eventCategories, eventLocations } from "../data/eventsData";
import { eventState, statusLabel } from "../lib/eventStatus";
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
} from "../data/organiserEventsData";
import { formatShortDay } from "../lib/formatDates";
import { readPage, useUrlParams } from "../hooks/useUrlParams";
import { useDeleteEvent } from "../hooks/useDeleteEvent";

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
  const { searchParams, setParams, setPage, setSearchParams } = useUrlParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const { message, deleteEvent } = useDeleteEvent(onDeleteEvent, organiserEventMessages.eventDeleted);
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
  const page = readPage(searchParams, pageCount);
  const firstIndex = (page - 1) * myEventsPageSize;
  const pageEvents = filteredEvents.slice(firstIndex, firstIndex + myEventsPageSize);

  // Only statuses the organiser has, plus All and whichever is selected
  const statusOptions = statusViews.options
    .filter((option) => option.value === "all" || counts[option.value] > 0 || option.value === status)
    .map((option) => ({ ...option, count: counts[option.value] ?? 0 }));

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
    setParams({ date: nextDate, page: null });
  }

  function handleSortChange(nextSort) {
    setParams({ sort: nextSort === "newest" ? null : nextSort, page: null });
  }

  function handleStatusChange(nextStatus) {
    setParams({ status: nextStatus === "all" ? null : nextStatus, page: null });
  }

  function handlePageChange(nextPage) {
    setPage(nextPage);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gridRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchParams({});
  }

  return (
    <div className="dashboard-page">
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
             
             
            />

            {/* Where Explore has its date pills and view switcher */}
            <div className="events-when-row">
              <FilterPills
                label={statusViews.label}
                options={statusOptions}
                value={status}
                onChange={handleStatusChange}
              />
              {/* A second filter beside the sort, apart from the status pills
                  so it reads as "and", not one more status */}
              <div className="events-when-tools">
                <span className="events-when-date">
                  <button
                    className={`pill events-when-option ${date ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={Boolean(date)}
                    onClick={openDatePicker}
                  >
                    <CalendarDays aria-hidden="true" />
                    {date ? formatShortDay(`${date}T00:00:00`) : myEventsDate.pick}
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
                    className="icon-button events-when-clear"
                    type="button"
                    aria-label={myEventsDate.clear}
                    onClick={() => handleDateChange("")}
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
                <SortSelect label={sortLabel} options={sortOptions} value={sort} onChange={handleSortChange} />
              </div>
            </div>
          </>
        )}

        {message && (
          <StatusMessage variant={message.variant} className="table-message">{message.text}</StatusMessage>
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
                  statusLabel={statusLabel(state, "organiser")}
                  muted={state === "past" || state === "cancelled"}
                  editTo={canEdit ? editEventPath(event.eventId) : undefined}
                  onDelete={canDelete ? deleteEvent : undefined}
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
