import { useEffect, useRef, useState } from "react";
import { Grid2X2, Grid3X3, Square, X } from "lucide-react";
import Button from "../UI/Button";
import DatePill from "../UI/DatePill";
import FilterPills from "../UI/FilterPills";
import Pagination from "../UI/Pagination";
import EventCard from "./EventCard";
import SearchBar from "./SearchBar";
import { eventCategories, eventLocations } from "../../data/eventsData";
import { resultsText, whenOptions } from "../../data/exploreEventsData";
import { eventsPath, toEvent } from "../../lib/publicEvents";
import { useApi } from "../../hooks/useApi";
import { readPage, useUrlParams } from "../../hooks/useUrlParams";
import { formatShortDay } from "../../lib/formatDates";

const defaultFilters = { q: "", when: "", date: "", category: "", location: "" };
const validViews = ["three", "two", "one"];
// 12 fills whole rows in the three-, two- and one-column views
const PAGE_SIZE = 12;
const validWhens = whenOptions.map((option) => option.id);

// Values the API would refuse (a hand-typed area, a malformed date) are
// dropped here, so the address can't turn the list into an error
function readFilters(searchParams) {
  const pick = (name, valid) => {
    const value = searchParams.get(name) ?? "";
    return valid(value) ? value : "";
  };

  return {
    q: searchParams.get("q") ?? "",
    when: pick("when", (value) => validWhens.includes(value)),
    date: pick("date", (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))),
    category: pick("category", (value) => eventCategories.some(({ id }) => id === value)),
    location: pick("location", (value) => eventLocations.some(({ id }) => id === value)),
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
    date: () => formatShortDay(`${filters.date}T00:00:00`),
    category: () => nameOf(eventCategories, filters.category),
    location: () => nameOf(eventLocations, filters.location),
  };

  return Object.keys(labels)
    .filter((key) => filters[key].trim())
    .map((key) => ({ key, label: labels[key]() }));
}

export default function EventsBrowser({
  canFavourite = false,
  favouriteIds = [],
  onToggleFavourite,
}) {
  const { searchParams, setParams, setPage, setSearchParams } = useUrlParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  // A link can change the address while this page is open (the footer's
  // "Tonight", the navbar's Explore Events), so a new address this page didn't
  // write is read again. React Router changes the address in a transition, so
  // a render can fall between writing it and seeing it: compare with the
  // address last seen, or that render would read the old one over the filters
  const search = searchParams.toString();
  const [seenSearch, setSeenSearch] = useState(search);
  const [writtenSearch, setWrittenSearch] = useState(null);
  if (search !== seenSearch) {
    setSeenSearch(search);
    setWrittenSearch(null);
    if (search !== writtenSearch) setFilters(readFilters(searchParams));
  }
  // The earliest day the date picker offers
  const [now] = useState(() => new Date());
  const view = validViews.includes(searchParams.get("view"))
    ? searchParams.get("view")
    : "three";

  // The server filters, sorts and pages (GET /events). It is asked for what the
  // address says, not what is typed but not yet searched
  const requestedPage = readPage(searchParams);
  const { payload, error, loading, retry } = useApi(
    eventsPath({ ...readFilters(searchParams), page: requestedPage, limit: PAGE_SIZE }),
  );
  const pageEvents = payload?.data.map(toEvent) ?? [];
  const total = payload?.pagination.total ?? 0;
  const pageCount = payload?.pagination.totalPages ?? 1;
  const page = payload?.pagination.page ?? requestedPage;
  const firstIndex = (page - 1) * PAGE_SIZE;

  const chips = filterChips(filters);
  const resultsRef = useRef(null);

  // A page number past the end (typed, or the list shrank) goes to the last page
  useEffect(() => {
    if (!loading && payload && total > 0 && requestedPage > pageCount) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(pageCount));
          return next;
        },
        { replace: true },
      );
    }
  }, [loading, payload, total, requestedPage, pageCount, setSearchParams]);

  // The URL follows the filters so the result can be shared or bookmarked.
  // Not carrying "page" over means a new filter starts again at page 1
  function applyFilters(nextFilters) {
    const nextParams = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value.trim()) nextParams.set(key, value.trim());
    });
    nextParams.set("view", view);
    setFilters(nextFilters);
    setWrittenSearch(nextParams.toString());
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

  function handleDatePick(date) {
    applyFilters({ ...filters, date, when: "" });
  }

  function handlePageChange(nextPage) {
    setWrittenSearch(setPage(nextPage).toString());
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function handleViewChange(nextView) {
    // Only the layout changed: keep any filters typed but not yet searched
    setWrittenSearch(setParams({ view: nextView }).toString());
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
      <SearchBar filters={filters} categories={eventCategories} locations={eventLocations} onChange={handleFilterChange} onSubmit={handleSearchSubmit} />

      {/* Date pills and the layout switch share one row */}
      <div className="events-when-row">
        {/* A picked date selects none of the pills, "Any date" included */}
        <FilterPills
          label="When"
          options={whenOptions.map(({ id, label }) => ({ value: id, label }))}
          value={filters.date ? null : filters.when}
          onChange={handleWhenChange}
        >
          <DatePill value={filters.date} onChange={handleDatePick} label={resultsText.pickDate} min={localDate(now)} />
        </FilterPills>
        <div className="events-view-switcher" role="group" aria-label="Event layout view">
          {[
            ["three", Grid3X3, "3-column grid"],
            ["two", Grid2X2, "2-column grid"],
            ["one", Square, "1-column list"],
          ].map(([value, Icon, label]) => (
            <button className={`icon-button ${view === value ? "is-active" : ""}`} type="button" aria-label={label} aria-pressed={view === value} onClick={() => handleViewChange(value)} key={value}>
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* Result count, then one chip per filter in use. Pagination scrolls back here */}
      <div className="w-full max-w-7xl flex flex-wrap items-center gap-2 scroll-mt-4" ref={resultsRef}>
        <p className="events-count" aria-live="polite">
          {payload ? resultsText.count(total) : resultsText.loading}
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

      <div className={`events-grid events-grid-${view}`} aria-busy={loading}>
        {error ? (
          <div className="events-empty-state" role="alert">
            <p className="content-p">{resultsText.loadError}</p>
            <Button type="button" variant="secondary" size="sm" onClick={retry}>
              {resultsText.retry}
            </Button>
          </div>
        ) : !payload ? null : pageEvents.length === 0 ? (
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
          total,
        )}
      />
    </>
  );
}
