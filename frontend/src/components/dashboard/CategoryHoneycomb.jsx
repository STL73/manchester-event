import { useId, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import Tooltip from "../UI/Tooltip";
import { honeycombRows } from "../../lib/honeycomb";
import { categoryCountLabel, categoryIcon } from "../../data/preferencesData";

// Cell width in px: 128 at most, and the row count drops before a cell gets
// narrower than 112, down to two a row. A phone beside the dashboard's icon
// rail leaves about 200px, so its rows go 1-2-1-2 with cells near 100px
const CELL = 128;
const MIN_CELL = 112;
const SMALL_CELL = 110;
const GAP = 8;
const MIN_PER_ROW = 2;

function layoutFor(width, count) {
  const perRow = Math.max(MIN_PER_ROW, Math.floor((width + GAP) / (MIN_CELL + GAP)));
  const rows = honeycombRows(count, perRow);
  const widest = Math.max(...rows.map((row) => row.slots));
  const cell = Math.min(CELL, Math.floor((width - (widest - 1) * GAP) / widest));
  return { rows, cell };
}

// Edge cells open their description inwards so it stays inside the panel;
// a cell alone in its row sits in the middle, so its opens centred
function tooltipAlign(slot, slots) {
  if (slots === 1) return "center";
  if (slot === 0) return "start";
  if (slot === slots - 1) return "end";
  return "center";
}

// Interest picker: one hexagon per category, like the logo's cells. Each is
// a real checkbox, so Tab and Space work and screen readers announce the
// ticked state. The rows depend on the width the panel actually has
export default function CategoryHoneycomb({ categories, counts, selectedIds, onToggle }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const descriptionId = useId();

  // Measured before the first paint, so the rows never jump into place
  useLayoutEffect(() => {
    const element = ref.current;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { rows, cell } = layoutFor(width, categories.length);
  let next = 0;

  return (
    <div
      ref={ref}
      className="honeycomb"
      data-size={cell < SMALL_CELL ? "small" : undefined}
      style={{ "--honeycomb-cell": `${cell}px` }}
    >
      {width > 0 &&
        rows.map((row) => {
          const rowCategories = categories.slice(next, next + row.filled);
          next += row.filled;

          return (
            <div className="honeycomb-row" key={rowCategories[0].id}>
              {rowCategories.map((category, slot) => {
                const Icon = categoryIcon(category.id);
                const describedBy = `${descriptionId}-${category.id}`;

                return (
                  <Tooltip
                    key={category.id}
                    text={category.description}
                    id={describedBy}
                    align={tooltipAlign(slot, row.slots)}
                    wrap
                  >
                    <label className="honeycomb-cell">
                      <input
                        type="checkbox"
                        className="sr-only"
                        name="categories"
                        value={category.id}
                        checked={selectedIds.includes(category.id)}
                        onChange={() => onToggle(category.id)}
                        aria-describedby={describedBy}
                      />
                      <span className="honeycomb-hex">
                        <Check className="honeycomb-tick" aria-hidden="true" />
                        <span className="honeycomb-body">
                          <Icon className="honeycomb-icon" aria-hidden="true" />
                          <span className="honeycomb-name">{category.name}</span>
                          <span className="honeycomb-count">
                            {categoryCountLabel(counts[category.id] ?? 0)}
                          </span>
                        </span>
                      </span>
                    </label>
                  </Tooltip>
                );
              })}
              {Array.from({ length: row.slots - row.filled }, (_, index) => (
                <span className="honeycomb-gap" key={`gap-${index}`} aria-hidden="true" />
              ))}
            </div>
          );
        })}
    </div>
  );
}
