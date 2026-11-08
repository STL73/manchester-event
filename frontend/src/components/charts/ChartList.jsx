
// The rows of a list panel (Up next, Most saved, Waiting longest), edge to
// edge like the admin lists: something at the start (a rank, a date, an
// icon), a name with one line under it, and a figure or badge at the end
export default function ChartList({ items }) {
  return (
    <ol className="chart-list">
      {items.map((item) => (
        <li className="list-row chart-list-row" key={item.key}>
          <span className="chart-list-lead">{item.lead}</span>
          <div className="min-w-0">
            <p className="chart-list-title">{item.title}</p>
            {item.detail && <p className="chart-list-detail">{item.detail}</p>}
          </div>
          {item.end != null && <span className="chart-list-end">{item.end}</span>}
        </li>
      ))}
    </ol>
  );
}
