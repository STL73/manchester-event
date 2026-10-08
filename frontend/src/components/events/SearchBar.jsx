import { CalendarDays, Search } from "lucide-react";
import Button from "../UI/Button";

export default function SearchBar({
  filters,
  categories,
  locations,
  onChange,
  onSubmit,
  children,
  submitLabel = "Search",
  submitIcon: SubmitIcon = Search,
  className = "",
}) {
  return (
    <form
      className={`events-search ${className}`}
      role="search"
      aria-label="Search events"
      onSubmit={onSubmit}
    >
      {/* Keywords first: it spans the widest column and keeps Tab order
          matching what is seen */}
      <label className="sr-only" htmlFor="event-keywords">
        Keywords
      </label>
      <input
        id="event-keywords"
        name="q"
        type="search"
        value={filters.q}
        className="events-search-input events-search-keywords"
        placeholder="Search events, keywords..."
        onChange={onChange}
      />

      <label className="sr-only" htmlFor="event-date">
        Date
      </label>
      {/* The browser's calendar button is made invisible but stays clickable
          on top of a Lucide icon in the accent colour */}
      <div className="date-field">
        <input
          id="event-date"
          name="date"
          type="date"
          value={filters.date}
          className="events-search-input"
          onChange={onChange}
        />
        <CalendarDays className="date-field-icon" aria-hidden="true" />
      </div>

      <label className="sr-only" htmlFor="event-category">
        Category
      </label>
      <select
        id="event-category"
        name="category"
        value={filters.category}
        className="events-search-input"
        onChange={onChange}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="event-location">
        Location
      </label>
      <select
        id="event-location"
        name="location"
        value={filters.location}
        className="events-search-input"
        onChange={onChange}
      >
        <option value="">All Locations</option>
        {locations.map((location) => (
          <option value={location.id} key={location.id}>
            {location.name}
          </option>
        ))}
      </select>

      {/* Extra fields, e.g. the status and sort dropdowns on My Events */}
      {children}

      {/* rounded-lg! matches the fields' 8px corners (buttons are pills) */}
      <Button type="submit" variant="primary" size="md" className="rounded-lg!">
        <SubmitIcon aria-hidden="true" />
        {submitLabel}
      </Button>
    </form>
  );
}
