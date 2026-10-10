import Button from "../UI/Button";

// A page's own actions beside its title, e.g. "Create event" on My Events.
// Only things the page does: navigation shortcuts were removed 2026-10-10
// because the sidebar already links every page. Solid accent, as buttons
// that do something are
export default function DashboardShortcuts({ actions = [] }) {
  if (actions.length === 0) return null;

  return (
    <div className="dashboard-page-actions" role="group" aria-label="Page actions">
      {actions.map(({ label, to, icon: Icon }) => (
        <Button key={label} to={to} variant="primary" size="sm">
          <Icon aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  );
}
