import { ChartNoAxesColumn } from "lucide-react";
import EmptyState from "../UI/EmptyState";
import { chartText } from "../../data/analyticsData";

// A chart with its title and a "View data table" twin, so every value can be
// read without hovering (and by screen readers). `columns` lists the value
// columns ({ key, heading }); by default a single Count column. `actions`
// (e.g. the range control) sit in the header, next to the chart they change.
// `table={false}` is for panels whose content is already text (lists, facts):
// it is shown as it is, readable by screen readers, with no table twin.
// `empty` replaces the generic "No data yet." where the panel can say more.
// `interactive` is for content with controls in it (the followers
// honeycomb): it stays reachable rather than hidden behind its table twin.
export default function ChartCard({
  id,
  title,
  description,
  rows,
  xHeading,
  columns = [{ key: "count", heading: chartText.countHeading }],
  wide = false,
  actions,
  table = true,
  empty = chartText.noData,
  interactive = false,
  children,
}) {
  const titleId = `${id}-title`;

  return (
    <article
      className={`panel min-w-0 p-4 flex flex-col gap-4 ${wide ? "col-span-full" : ""}`}
      aria-labelledby={titleId}
    >
      {/* Title and description left, controls right. The text wraps in its
          own column (at least 20rem) rather than pushing the controls down,
          so they move below only when the panel is narrow, never because
          one description is longer than another (the growth metric switch) */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-80 flex flex-col gap-1">
          <h2 className="heading-panel" id={titleId}>
            {title}
          </h2>
          {description && <p className="chart-card-description">{description}</p>}
        </div>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </header>

      {rows.length === 0 && <EmptyState icon={ChartNoAxesColumn} text={empty} />}
      {rows.length > 0 && !table && children}
      {rows.length > 0 && table && (
        <>
          {/* The table below carries the same values for screen readers */}
          <div className="chart-plot" aria-hidden={interactive ? undefined : "true"}>
            {children}
          </div>
          <details className="chart-table-toggle">
            <summary>{chartText.viewTable}</summary>
            <div className="panel table-wrapper">
              <table className="data-table">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>
                    <th scope="col">{xHeading}</th>
                    {columns.map((column) => (
                      <th scope="col" key={column.key}>
                        {column.heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.fullLabel ?? row.label}</td>
                      {columns.map((column) => (
                        <td className="tabular-nums" key={column.key}>
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </article>
  );
}
