import DashboardShortcuts from "./DashboardShortcuts";

// Title row of an inner dashboard page, with the page's shortcuts beside it.
// The PHP pages opened with a Quick Actions block above the title; on inner
// pages the title comes first so it says where you are (Home's greeting
// row does the same, see DashboardGreeting)
export default function DashboardPageHeading({ id, icon: Icon, title, actions }) {
  return (
    <div className="section-heading-row dashboard-page-heading">
      <h2 className="dashboard-title" id={id}>
        <Icon className="dashboard-title-icon" aria-hidden="true" />
        {title}
      </h2>
      <DashboardShortcuts actions={actions} />
    </div>
  );
}
