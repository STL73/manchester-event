import { weekGridText } from "../../data/analyticsData";

// Start times by weekday and time of day, brighter for more, the figure in every
// cell. Too narrow for the slot names, the headings show icons
export default function WeekTimeGrid({ grid }) {
  const max = Math.max(1, ...grid.flat());

  return (
    <div className="week-grid-frame">
      <div className="week-grid">
        <span />
        {weekGridText.slots.map((slot, index) => {
          const Icon = weekGridText.slotIcons[index];
          return (
            <span className="week-grid-slot" title={slot} key={slot}>
              <span className="week-grid-slot-name">{slot}</span>
              <Icon aria-hidden="true" />
            </span>
          );
        })}
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
    </div>
  );
}
