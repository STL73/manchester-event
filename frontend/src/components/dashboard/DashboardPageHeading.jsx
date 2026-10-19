import DashboardShortcuts from "./DashboardShortcuts";

// Title row of an inner dashboard page: the page's <h1>, its shortcuts (or
// other buttons, passed as children) beside it, and an optional one-line
// summary under it. The PHP pages opened with a Quick Actions block above
// the title; here the title comes first so it says where you are. Home's
// greeting does the same job (see DashboardGreeting)
export default function DashboardPageHeading({
  id,
  icon: Icon,
  title,
  summary,
  actions,
  children,
}) {
  return (
    <header className="dashboard-page-heading">
      <div className="section-heading-row dashboard-page-heading-row">
        <h1 className="heading-page dashboard-page-title" id={id}>
          {/* The icon sits in the logo's hexagon cell on every page */}
          <span className="dashboard-page-title-hex" aria-hidden="true">
            <Icon />
          </span>
          {title}
        </h1>
        <DashboardShortcuts actions={actions} />
        {children}
      </div>
      {summary && <p className="dashboard-page-summary">{summary}</p>}
    </header>
  );
}
