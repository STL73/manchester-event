import { useMemo, useState } from "react";
import { Grid2X2, Grid3X3, Square } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "../UI/Button";
import EventCard from "./EventCard";
import SearchBar from "./SearchBar";
import { eventCategories, eventLocations } from "../../data/eventsData";

const defaultFilters = { date: "", category: "", location: "", q: "" };
const validViews = ["three", "two", "one"];

function readFilters(searchParams) {
  return {
    date: searchParams.get("date") ?? "",
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
    q: searchParams.get("q") ?? "",
  };
}

export default function EventsBrowser({
  events,
  canFavourite = false,
  favouriteIds = [],
  onToggleFavourite,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const view = validViews.includes(searchParams.get("view"))
    ? searchParams.get("view")
    : "three";

  const filteredEvents = useMemo(() => {
    const query = filters.q.trim().toLowerCase();

    return events.filter((event) => {
      const eventDate = event.startDatetime.slice(0, 10);
      const searchableText =
        `${event.name} ${event.category} ${event.location}`.toLowerCase();

      return (
        (!filters.date || eventDate === filters.date) &&
        (!filters.category || event.categoryId === filters.category) &&
        (!filters.location || event.locationId === filters.location) &&
        (!query || searchableText.includes(query))
      );
    });
  }, [events, filters]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
    });
    nextParams.set("view", view);
    setSearchParams(nextParams);
  }

  function handleViewChange(nextView) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", nextView);
    setSearchParams(nextParams);
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setSearchParams({ view });
  }

  // Search, layout switcher and cards only; ExploreEvents supplies the
  // public or dashboard layout around them
  return (
    <>
      <SearchBar filters={filters} categories={eventCategories} locations={eventLocations} onChange={handleFilterChange} onSubmit={handleSearchSubmit} />

      <div className="events-toolbar">
        <p className="events-toolbar-label">Change layout view:</p>
        <div className="events-view-switcher" aria-label="Event layout view">
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
            <p className="content-p">No events match your search.</p>
            <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
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
