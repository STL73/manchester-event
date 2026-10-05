import { chartText } from "../../data/analyticsData";

// A chart with its title and a "View data table" twin, so every value can be
// read without hovering (and by screen readers). `columns` lists the value
// columns ({ key, heading }); by default a single Count column. `actions`
// (e.g. the range control) sit in the header, next to the chart they change.
export default function ChartCard({
  id,
  title,
  description,
  rows,
  xHeading,
  columns = [{ key: "count", heading: chartText.countHeading }],
  wide = false,
  actions,
  children,
}) {
  const titleId = `${id}-title`;

  return (
    <article
      className={`chart-card ${wide ? "chart-card-wide" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="chart-card-header">
        <div className="chart-card-heading">
          <h3 className="chart-card-title" id={titleId}>
            {title}
          </h3>
          {description && <p className="chart-card-description">{description}</p>}
        </div>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </header>

      {rows.length === 0 ? (
        <p className="dashboard-empty-text">{chartText.noData}</p>
      ) : (
        <>
          {/* The table below carries the same values for screen readers */}
          <div className="chart-plot" aria-hidden="true">
            {children}
          </div>
          <details className="chart-table-toggle">
            <summary>{chartText.viewTable}</summary>
            <div className="table-wrapper">
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
