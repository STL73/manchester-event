import { weekGridText } from "../../data/analyticsData";

// "When events happen": start times by day of the week (Monday first) and
// time of day, from getWeekTimeGrid. Brighter = more; an empty cell stays
// blank. The figure is in every cell, so it reads without hovering
export default function WeekTimeGrid({ grid }) {
  const max = Math.max(1, ...grid.flat());

  return (
    <div className="week-grid">
      <span />
      {weekGridText.slots.map((slot) => (
        <span className="week-grid-slot" key={slot}>
          {slot}
        </span>
      ))}
      {grid.map((counts, day) => (
        <div className="contents" key={weekGridText.days[day]}>
          <span className="week-grid-day">{weekGridText.days[day]}</span>
          {counts.map((count, slot) => (
            <span
              className="week-grid-cell"
              style={{ "--level": `${count ? Math.round(10 + (count / max) * 70) : 0}%` }}
              key={weekGridText.slots[slot]}
            >
              {count || ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
