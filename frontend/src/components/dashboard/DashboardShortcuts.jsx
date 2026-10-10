import Button from "../UI/Button";

// A page's shortcuts, beside its title (or Home's greeting). No visible
// "Quick actions" label: the icons and labels say what they are, and
// screen readers get the group's name instead
export default function DashboardShortcuts({ actions = [] }) {
  if (actions.length === 0) return null;

  return (
    <div className="dashboard-page-actions" role="group" aria-label="Quick actions">
      {actions.map(({ label, to, icon: Icon }) => (
        <Button key={label} to={to} variant="secondary" size="sm">
          <Icon aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  );
}
