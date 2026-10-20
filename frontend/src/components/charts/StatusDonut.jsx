// A circle this size has a circumference of 100, so each part's dash length
// is its percentage
const RADIUS = 15.9155;
// A small gap between parts, so neighbours never run together
const GAP = 0.8;

// Events by status as a ring with the total in the middle, and a legend
// giving each status's count and share. Colours are the status tones (the
// stroke reads --tone, so it always matches the badges). Replaces the
// status column chart, which looked empty with few statuses (2026-10-20)
export default function StatusDonut({ rows, tones, unit }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const shown = rows.filter((row) => row.count > 0);
  const shareOf = (row) => (row.count / total) * 100;
  // Each part starts where the ones before it end
  const parts = shown.map((row, index) => ({
    row,
    share: shareOf(row),
    start: shown.slice(0, index).reduce((sum, before) => sum + shareOf(before), 0),
  }));

  return (
    <div className="donut">
      <div className="donut-ring">
        <svg viewBox="0 0 42 42">
          {parts.map(({ row, share, start }) => {
            const length = parts.length > 1 ? Math.max(share - GAP, 0.4) : 100;
            return (
              <circle
                className={`tone-${tones?.[row.key] ?? "accent"}`}
                style={{ stroke: "var(--tone)" }}
                cx="21"
                cy="21"
                r={RADIUS}
                fill="none"
                strokeWidth="5"
                strokeDasharray={`${length} ${100 - length}`}
                // Starts at 12 o'clock and runs clockwise
                strokeDashoffset={25 - start}
                key={row.key}
              />
            );
          })}
        </svg>
        <p className="donut-total">
          <strong>{total}</strong>
          <span>{unit}</span>
        </p>
      </div>
      <ul className="donut-legend">
        {rows.map((row) => (
          <li className={`tone-${tones?.[row.key] ?? "accent"}`} key={row.key}>
            <span className="donut-key" />
            <span className="text-muted">{row.label}</span>
            <strong>{row.count}</strong>
            <span className="donut-share">
              {total ? Math.round((row.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
