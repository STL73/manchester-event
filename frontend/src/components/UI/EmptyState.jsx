// A dashboard page's "nothing here" box: three of the logo's cells with the
// page's icon, the message, and any action (children)
export default function EmptyState({ icon: Icon, text, children }) {
  return (
    <div className="dashboard-empty-state">
      <div className="relative h-18 w-19" aria-hidden="true">
        <span className="hex-frame empty-hex empty-hex-left" />
        <span className="hex-frame empty-hex empty-hex-right" />
        <span className="hex-frame empty-hex empty-hex-front">{Icon && <Icon />}</span>
      </div>
      <p className="dashboard-empty-text">{text}</p>
      {children}
    </div>
  );
}
