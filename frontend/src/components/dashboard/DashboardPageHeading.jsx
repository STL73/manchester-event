import Button from "../UI/Button";

// An inner dashboard page's title row: its <h1>, its own actions beside it, and
// an optional summary. No navigation shortcuts: the sidebar links every page
export default function DashboardPageHeading({
  id,
  icon: Icon,
  title,
  summary,
  actions = [],
  children,
}) {
  // The page's title row, 32px above the content (this margin plus the section's 16px gap). The
  // actions wrap under the title when the row runs out of room
  return (
    <header className="w-full mb-4 flex flex-col gap-2">
      <div className="section-heading-row flex-wrap gap-y-3">
        {/* The page title matches Home's greeting; section headings below it stay smaller and
           muted (.dashboard-title) */}
        <h1 className="heading-page min-w-0 flex items-center gap-3" id={id}>
          {/* The icon sits in the logo's hexagon cell on every page */}
          <span className="hex-frame dashboard-page-title-hex" aria-hidden="true">
            <Icon />
          </span>
          {title}
        </h1>
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Page actions">
            {actions.map(({ label, to, icon: ActionIcon }) => (
              <Button key={label} to={to} variant="primary" size="sm">
                <ActionIcon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
        )}
        {children}
      </div>
      {summary && <p className="dashboard-page-summary">{summary}</p>}
    </header>
  );
}
