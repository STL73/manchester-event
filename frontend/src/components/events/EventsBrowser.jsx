import { useMemo, useRef, useState } from "react";
import { CalendarDays, Grid2X2, Grid3X3, Square, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "../UI/Button";
import Pagination from "../UI/Pagination";
import EventCard from "./EventCard";
import SearchBar from "./SearchBar";
import { eventCategories, eventLocations } from "../../data/eventsData";
import { resultsText, whenOptions } from "../../data/exploreEventsData";
import { bySoonest, isUpcoming, matchesWhen } from "../../lib/eventDates";

const defaultFilters = { q: "", when: "", date: "", category: "", location: "" };
const validViews = ["three", "two", "one"];
// 12 fills whole rows in the three-, two- and one-column views
const PAGE_SIZE = 12;
const validWhens = whenOptions.map((option) => option.id);

const chipDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function readFilters(searchParams) {
  const when = searchParams.get("when") ?? "";

  return {
    q: searchParams.get("q") ?? "",
    when: validWhens.includes(when) ? when : "",
    date: searchParams.get("date") ?? "",
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
  };
}

// yyyy-mm-dd in local time, for the date picker's earliest day
function localDate(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function nameOf(list, id) {
  return list.find((item) => item.id === id)?.name ?? id;
}

// One removable chip per filter in use, so a visitor who arrives from a Home
// page link can see why the list is shorter
function filterChips(filters) {
  const labels = {
    q: () => `"${filters.q.trim()}"`,
    when: () => whenOptions.find((option) => option.id === filters.when).label,
    date: () => chipDate.format(new Date(`${filters.date}T00:00:00`)),
    category: () => nameOf(eventCategories, filters.category),
    location: () => nameOf(eventLocations, filters.location),
  };

  return Object.keys(labels)
    .filter((key) => filters[key].trim())
    .map((key) => ({ key, label: labels[key]() }));
}

export default function EventsBrowser({
  events,
  canFavourite = false,
  favouriteIds = [],
  onToggleFavourite,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  // A link can change the address while this page is open (the footer's
  // "Tonight", the navbar's Explore Events). When the address no longer
  // matches what the filters last wrote or read, read it again
  const [syncedSearch, setSyncedSearch] = useState(() => searchParams.toString());
  if (searchParams.toString() !== syncedSearch) {
    setSyncedSearch(searchParams.toString());
    setFilters(readFilters(searchParams));
  }
  // Fixed when the page opens, so the list doesn't reshuffle while it's read
  const [now] = useState(() => new Date());
  const view = validViews.includes(searchParams.get("view"))
    ? searchParams.get("view")
    : "three";

  const filteredEvents = useMemo(() => {
    const query = filters.q.trim().toLowerCase();

    return events
      .filter((event) => {
        const eventDate = event.startDatetime.slice(0, 10);
        const searchableText =
          `${event.name} ${event.category} ${event.location}`.toLowerCase();

        return (
          isUpcoming(event, now) &&
          matchesWhen(event, filters.when, now) &&
          (!filters.date || eventDate === filters.date) &&
          (!filters.category || event.categoryId === filters.category) &&
          (!filters.location || event.locationId === filters.location) &&
          (!query || searchableText.includes(query))
        );
      })
      .sort(bySoonest);
  }, [events, filters, now]);

  const chips = filterChips(filters);
  const dateInputRef = useRef(null);
  const resultsRef = useRef(null);

  // The page lives in the URL like the filters; out-of-range numbers clamp
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * PAGE_SIZE;
  const pageEvents = filteredEvents.slice(firstIndex, firstIndex + PAGE_SIZE);

  // The URL follows the filters so the result can be shared or bookmarked.
  // Not carrying "page" over means a new filter starts again at page 1
  function applyFilters(nextFilters) {
    const nextParams = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value.trim()) nextParams.set(key, value.trim());
    });
    nextParams.set("view", view);
    setFilters(nextFilters);
    setSyncedSearch(nextParams.toString());
    setSearchParams(nextParams);
  }

  // An exact date and a date range can't both apply, so each clears the other
  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
      ...(name === "date" && value ? { when: "" } : {}),
    }));
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    applyFilters(filters);
  }

  // Every date pill, "Any date" included, replaces a picked date
  function handleWhenChange(when) {
    applyFilters({ ...filters, when, date: "" });
  }

  // "Pick a date" opens the browser's own calendar from a hidden date input
  function openDatePicker() {
    const input = dateInputRef.current;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  function handleDatePick(event) {
    applyFilters({ ...filters, date: event.target.value, when: "" });
  }

  function handlePageChange(nextPage) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    else nextParams.delete("page");
    setSyncedSearch(nextParams.toString());
    setSearchParams(nextParams);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function handleViewChange(nextView) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", nextView);
    // Only the layout changed: keep any filters typed but not yet searched
    setSyncedSearch(nextParams.toString());
    setSearchParams(nextParams);
  }

  function removeFilter(key) {
    applyFilters({ ...filters, [key]: "" });
  }

  function resetFilters() {
    applyFilters(defaultFilters);
  }

  // Search, filters and cards only; ExploreEvents supplies the public or
  // dashboard layout around them
  return (
    <>
      <SearchBar filters={filters} categories={eventCategories} locations={eventLocations} onChange={handleFilterChange} onSubmit={handleSearchSubmit} showDate={false} className="events-search-no-date" />

      {/* Date pills and the layout switch share one row */}
      <div className="events-when-row">
        <div className="events-when" role="group" aria-label="When">
          {whenOptions.map(({ id, label }) => {
            // "Any date" is only selected when no date has been picked either
            const isActive = filters.when === id && !(id === "" && filters.date);
            return (
              <button className={`events-when-option ${isActive ? "is-active" : ""}`} type="button" aria-pressed={isActive} onClick={() => handleWhenChange(id)} key={id || "any"}>
                {label}
              </button>
            );
          })}
          <span className="events-when-date">
            <button className={`events-when-option ${filters.date ? "is-active" : ""}`} type="button" aria-pressed={Boolean(filters.date)} onClick={openDatePicker}>
              <CalendarDays aria-hidden="true" />
              {filters.date ? chipDate.format(new Date(`${filters.date}T00:00:00`)) : resultsText.pickDate}
            </button>
            <input ref={dateInputRef} className="events-when-date-input" type="date" min={localDate(now)} value={filters.date} onChange={handleDatePick} tabIndex={-1} aria-hidden="true" />
          </span>
        </div>
        <div className="events-view-switcher" role="group" aria-label="Event layout view">
          {[
            ["three", Grid3X3, "3-column grid"],
            ["two", Grid2X2, "2-column grid"],
            ["one", Square, "1-column list"],
          ].map(([value, Icon, label]) => (
            <button className={view === value ? "is-active" : ""} type="button" aria-label={label} aria-pressed={view === value} onClick={() => handleViewChange(value)} key={value}>
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="events-results" ref={resultsRef}>
        <p className="events-count" aria-live="polite">
          {resultsText.count(filteredEvents.length)}
        </p>
        {chips.map(({ key, label }) => (
          <button className="filter-chip" type="button" aria-label={resultsText.removeFilter(label)} onClick={() => removeFilter(key)} key={key}>
            {label}
            <X aria-hidden="true" />
          </button>
        ))}
        {chips.length > 1 && (
          <button className="filter-chip-clear" type="button" onClick={resetFilters}>
            {resultsText.clearAll}
          </button>
        )}
      </div>

      <div className={`events-grid events-grid-${view}`}>
        {filteredEvents.length === 0 ? (
          <div className="events-empty-state">
            <p className="content-p">{resultsText.empty}</p>
            {chips.length > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
                {resultsText.clearFilters}
              </Button>
            )}
          </div>
        ) : (
          pageEvents.map((event) => (
            <EventCard key={event.eventId} event={event} canFavourite={canFavourite} isFavourite={favouriteIds.includes(event.eventId)} onToggleFavourite={onToggleFavourite} />
          ))
        )}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        summary={resultsText.showing(
          firstIndex + 1,
          firstIndex + pageEvents.length,
          filteredEvents.length,
        )}
      />
    </>
  );
}
