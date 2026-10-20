import ChartList from "./ChartList";
import { honeycombRows } from "../../lib/honeycomb";
import { categoryIcon } from "../../data/preferencesData";
import { reachText } from "../../data/analyticsData";

const TOP = 5;

// Followers per category as a small honeycomb, one cell per category with
// its icon, brighter = more followers (option A, decided 2026-10-20). The row
// width grows with the count, so a few categories still stack (5 = 2-3,
// 7 = 2-3-2, 19 = 3-4-5-4-3). Beside it the top five as a plain list; the
// rest are in the data table and on hover. `rows` is most followed first
export default function ReachHoneycomb({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  const level = (count) => `${Math.round(10 + (count / max) * 85)}%`;
  const perRow = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(rows.length))));
  const lines = honeycombRows(rows.length, perRow);

  return (
    <div className="flex flex-col gap-3">
      <div className="reach">
        <div className="reach-honeycomb">
          {lines.map((line, index) => {
            // Each row takes the categories after the rows above it
            const from = lines.slice(0, index).reduce((sum, above) => sum + above.filled, 0);
            const lineRows = rows.slice(from, from + line.filled);
            return (
              <div className="reach-row" key={lineRows[0].key}>
                {lineRows.map((row) => {
                  const Icon = categoryIcon(row.key);
                  return (
                    <span
                      className="reach-cell"
                      style={{ "--level": level(row.count) }}
                      title={reachText.cell(row.label, row.count)}
                      key={row.key}
                    >
                      <Icon />
                    </span>
                  );
                })}
                {Array.from({ length: line.slots - line.filled }, (_, index) => (
                  <span className="reach-cell invisible" key={`gap-${index}`} />
                ))}
              </div>
            );
          })}
        </div>
        <div className="min-w-50 flex-1">
          <ChartList
            items={rows.slice(0, TOP).map((row, index) => ({
              key: row.key,
              lead: index + 1,
              title: row.label,
              end: row.count,
            }))}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="chart-hint">
          {rows.length > TOP ? reachText.others(rows.length - TOP) : reachText.hover}
        </p>
        <p className="reach-key">
          {reachText.keyFewer}
          {[10, 38, 66, 95].map((step) => (
            <span className="reach-key-cell" style={{ "--level": `${step}%` }} key={step} />
          ))}
          {reachText.keyMore}
        </p>
      </div>
    </div>
  );
}
