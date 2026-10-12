// "Nothing here" box for dashboard pages: a small honeycomb of three of the
// logo's cells, the page's own icon in the front one, then the message and
// any action (children). The honeycomb is the dashboard's only decoration
// besides the title hexagon, so it appears only when a page is empty
// (decided 2026-10-11)
export default function EmptyState({ icon: Icon, text, children }) {
  return (
    <div className="dashboard-empty-state">
      <div className="empty-honeycomb" aria-hidden="true">
        <span className="empty-hex empty-hex-left" />
        <span className="empty-hex empty-hex-right" />
        <span className="empty-hex empty-hex-front">{Icon && <Icon />}</span>
      </div>
      <p className="dashboard-empty-text">{text}</p>
      {children}
    </div>
  );
}
