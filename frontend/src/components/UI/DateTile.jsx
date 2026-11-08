import { formatDayNumber, formatMonthShort } from "../../lib/formatDates";

// A date as a small tile at the start of a row: "24" over "OCT"
// (Preferences' next events, Event Analytics' coming-up list)
export default function DateTile({ date }) {
  const value = new Date(date);

  return (
    <span className="date-tile">
      <span className="date-tile-day">{formatDayNumber(value)}</span>
      <span className="date-tile-month">{formatMonthShort(value)}</span>
    </span>
  );
}
