import { createElement, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { honeycombRows } from "../../lib/honeycomb";
import { categoryIcon } from "../../data/preferencesData";

// The brightest cell stays at 62% accent, so the selected one (full accent)
// still stands out from it
const level = (share) => `${Math.round(8 + share * 54)}%`;

function formatPer(value) {
  return Number.isInteger(value) ? value : value.toFixed(1);
}

// Followers and events per category (decided 2026-10-20, from a preview of
// three hexagon versions): one cell per category with its icon, brighter =
// more followers for each event coming up, brightest first. Beside it a card
// that opens on every category and its followers; selecting a cell (or a
// name in the list) shows that category's figures, and selecting it again,
// "All categories" or Escape goes back. `rows` come from getSupplyAndDemand
export default function FollowersHoneycomb({ rows, text }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const cellRefs = useRef(new Map());
  const selected = rows.find((row) => row.key === selectedKey);

  const byAudience = [...rows].sort(
    (a, b) => (b.perEvent ?? -1) - (a.perEvent ?? -1) || b.followers - a.followers,
  );
  const byFollowers = [...rows].sort(
    (a, b) => b.followers - a.followers || a.label.localeCompare(b.label),
  );
  const max = Math.max(1, ...rows.map((row) => row.perEvent ?? 0));
  const follows = rows.reduce((sum, row) => sum + row.followers, 0);
  const upcoming = rows.reduce((sum, row) => sum + row.upcoming, 0);
  const perRow = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(rows.length))));
  const lines = honeycombRows(rows.length, perRow);

  function select(key) {
    setSelectedKey((current) => (current === key ? null : key));
  }

  // Back to the overview, with focus on the cell that was open
  function showAll() {
    const key = selectedKey;
    setSelectedKey(null);
    cellRefs.current.get(key)?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && selectedKey) showAll();
  }

  return (
    <div className="flex flex-col gap-3" onKeyDown={handleKeyDown}>
      <div className="followers">
        <div className="reach-honeycomb">
          {lines.map((line, index) => {
            const from = lines.slice(0, index).reduce((sum, above) => sum + above.filled, 0);
            const lineRows = byAudience.slice(from, from + line.filled);
            return (
              <div className="reach-row" key={lineRows[0].key}>
                {lineRows.map((row) => {
                  const Icon = categoryIcon(row.key);
                  const isSelected = row.key === selectedKey;
                  return (
                    <button
                      type="button"
                      className={`reach-cell followers-cell ${isSelected ? "is-selected" : ""}`}
                      style={{ "--level": level((row.perEvent ?? 0) / max) }}
                      aria-pressed={isSelected}
                      aria-label={row.label}
                      title={row.label}
                      onClick={() => select(row.key)}
                      ref={(node) => {
                        if (node) cellRefs.current.set(row.key, node);
                        else cellRefs.current.delete(row.key);
                      }}
                      key={row.key}
                    >
                      <Icon aria-hidden="true" />
                    </button>
                  );
                })}
                {Array.from({ length: line.slots - line.filled }, (_, gap) => (
                  <span className="reach-cell invisible" key={`gap-${gap}`} />
                ))}
              </div>
            );
          })}
        </div>

        <div className="followers-card" aria-live="polite">
          {selected ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="hex-frame h-8.25 w-7.5 shrink-0">
                  {createElement(categoryIcon(selected.key), {
                    className: "relative size-4 text-accent",
                    "aria-hidden": "true",
                  })}
                </span>
                <p className="followers-card-title">{selected.label}</p>
              </div>
              <dl className="followers-figures">
                <dt>{text.following}</dt>
                <dd className="is-big">{selected.followers}</dd>
                <dt>{text.upcoming}</dt>
                <dd className="is-big">{selected.upcoming}</dd>
                <dt>{text.perEvent}</dt>
                <dd>{selected.perEvent == null ? "–" : formatPer(selected.perEvent)}</dd>
              </dl>
              <p className="chart-hint">
                {selected.followers === 0
                  ? text.noFollowers
                  : selected.perEvent == null
                    ? text.noEvents(selected.followers)
                    : text.reach(formatPer(selected.perEvent))}
              </p>
              <button type="button" className="followers-back" onClick={showAll}>
                <ArrowLeft aria-hidden="true" />
                {text.back}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="followers-card-title">{text.allTitle}</p>
                <p className="chart-hint">{text.totals(follows, upcoming)}</p>
              </div>
              <ul className="followers-list">
                {byFollowers.map((row) => (
                  <li key={row.key}>
                    <button type="button" onClick={() => select(row.key)}>
                      <span className="truncate">{row.label}</span>
                      <span className="followers-list-count">{row.followers}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="chart-hint">{text.hint}</p>
        <p className="reach-key">
          {text.keyFewer}
          {[0, 1 / 3, 2 / 3, 1].map((share) => (
            <span className="reach-key-cell" style={{ "--level": level(share) }} key={share} />
          ))}
          {text.keyMore}
        </p>
      </div>
    </div>
  );
}
