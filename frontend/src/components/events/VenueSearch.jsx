import { useEffect, useId, useState } from "react";
import { MapPin } from "lucide-react";
import Button from "../UI/Button";
import { venueSearch } from "../../data/createEventsData";
import { eventLocations } from "../../data/eventsData";
import { api } from "../../lib/api";

// The event's venue: an ARIA combobox over OpenStreetMap's places, then the
// chosen one as a card with Change. Only its id is sent; the server looks it up
export default function VenueSearch({ id, venue, placeholder, invalid, describedBy, onChange }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ query: "", places: [], error: "" });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const trimmed = query.trim();
  const ready = trimmed.length >= venueSearch.minLength;
  // The answer on screen belongs to what is typed now, or it is still coming
  const searching = ready && results.query !== trimmed;
  const places = searching ? [] : results.places;

  useEffect(() => {
    if (!ready) return undefined;
    let current = true;
    const timer = setTimeout(() => {
      api(`/locations/search?q=${encodeURIComponent(trimmed)}`).then(
        ({ data }) => current && setResults({ query: trimmed, places: data, error: "" }),
        (error) => current && setResults({ query: trimmed, places: [], error: error.message }),
      );
    }, venueSearch.delay);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [ready, trimmed]);

  function choose(place) {
    onChange(place);
    setQuery("");
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(keyEvent) {
    if (keyEvent.key === "ArrowDown" || keyEvent.key === "ArrowUp") {
      keyEvent.preventDefault();
      setOpen(true);
      if (!places.length) return;
      const step = keyEvent.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + places.length) % places.length);
    } else if (keyEvent.key === "Enter" && open && places[active]) {
      // Picks the place rather than submitting the form
      keyEvent.preventDefault();
      choose(places[active]);
    } else if (keyEvent.key === "Escape" && open) {
      keyEvent.preventDefault();
      setOpen(false);
    }
  }

  const areaName = (area) => eventLocations.find((item) => item.id === area)?.name ?? venueSearch.noArea;
  const credit = (
    <a className="venue-credit" href={venueSearch.credit.href} target="_blank" rel="noreferrer">
      {venueSearch.credit.text}
    </a>
  );

  if (venue) {
    return (
      <div className="venue-chosen" id={id} tabIndex={-1} aria-describedby={describedBy}>
        <MapPin className="venue-chosen-icon" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="venue-chosen-name">{venue.name}</p>
          <p className="venue-chosen-address">{venue.address}</p>
          <p className="venue-chosen-area">{areaName(venue.area)}</p>
          {credit}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange(null)}>
          <venueSearch.change.icon aria-hidden="true" />
          {venueSearch.change.label}
        </Button>
      </div>
    );
  }

  const status = !trimmed
    ? ""
    : !ready
      ? venueSearch.typeMore
      : searching
        ? venueSearch.searching
        : results.error || (places.length ? "" : venueSearch.noResults);
  const showList = open && trimmed !== "";

  return (
    <div className="venue-search">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 && places[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(changeEvent) => {
          setQuery(changeEvent.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        // After a click on a suggestion has landed
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <div className="venue-options">
          <ul id={listId} role="listbox" aria-label={placeholder}>
            {places.map((place, index) => (
              <li
                key={place.placeId}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={`venue-option ${index === active ? "is-active" : ""}`}
                // Before the input's blur, so the click isn't lost
                onMouseDown={(mouseEvent) => {
                  mouseEvent.preventDefault();
                  choose(place);
                }}
              >
                <span className="venue-option-name">{place.name}</span>
                <span className="venue-option-address">{place.address}</span>
              </li>
            ))}
          </ul>
          {status && <p className="venue-options-status" role="status">{status}</p>}
          {credit}
        </div>
      )}
    </div>
  );
}
