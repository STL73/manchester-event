import { useMemo, useState } from "react";
import { Grid2X2, Grid3X3, Square, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "../UI/Button";
import EventCard from "./EventCard";
import SearchBar from "./SearchBar";
import { eventCategories, eventLocations } from "../../data/eventsData";
import { resultsText, whenOptions } from "../../data/exploreEventsData";
import { bySoonest, isUpcoming, matchesWhen } from "../../lib/eventDates";

const defaultFilters = { q: "", when: "", date: "", category: "", location: "" };
const validViews = ["three", "two", "one"];
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

  // Filters apply as they change; the URL follows so the result can be
  // shared or bookmarked
  function applyFilters(nextFilters) {
    const nextParams = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value.trim()) nextParams.set(key, value.trim());
    });
    nextParams.set("view", view);
    setFilters(nextFilters);
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

  function handleWhenChange(when) {
    applyFilters({ ...filters, when, date: when ? "" : filters.date });
  }

  function handleViewChange(nextView) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", nextView);
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
      <SearchBar filters={filters} categories={eventCategories} locations={eventLocations} onChange={handleFilterChange} onSubmit={handleSearchSubmit} />

      <div className="events-when" role="group" aria-label="When">
        {whenOptions.map(({ id, label }) => (
          <button className={`events-when-option ${filters.when === id ? "is-active" : ""}`} type="button" aria-pressed={filters.when === id} onClick={() => handleWhenChange(id)} key={id || "any"}>
            {label}
          </button>
        ))}
      </div>

      <div className="events-toolbar">
        <div className="events-results">
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
          filteredEvents.map((event) => (
            <EventCard key={event.eventId} event={event} canFavourite={canFavourite} isFavourite={favouriteIds.includes(event.eventId)} onToggleFavourite={onToggleFavourite} />
          ))
        )}
      </div>
    </>
  );
}
