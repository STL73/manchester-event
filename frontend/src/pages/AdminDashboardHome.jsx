import { ChartNoAxesColumn, Logs, Zap } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import {
  adminDashboardActions,
  recentAdminActions,
  siteTotalsCards,
  viewAllLogsAction,
} from "../data/adminDashboardData";
import { getSiteTotals } from "../lib/analytics";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Quick Insights are counted live from the shared users and events lists
export default function AdminDashboardHome({ users, events }) {
  const ViewAllIcon = viewAllLogsAction.icon;
  const totals = getSiteTotals(users, events);

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-actions-title"
      >
        <h2 className="dashboard-title" id="quick-actions-title">
          <Zap className="dashboard-title-icon" aria-hidden="true" />
          Quick Actions
        </h2>
        <div className="dashboard-actions">
          {adminDashboardActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="quick-insights-title"
      >
        <h2 className="dashboard-title" id="quick-insights-title">
          <ChartNoAxesColumn
            className="dashboard-title-icon"
            aria-hidden="true"
          />
          Quick Insights
        </h2>
        <div className="dashboard-grid">
          {siteTotalsCards.map((card) => (
            <DashboardCard key={card.id} item={{ ...card, count: totals[card.id] }} />
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="recent-admin-actions-title"
      >
        <h2 className="dashboard-title" id="recent-admin-actions-title">
          <Logs className="dashboard-title-icon" aria-hidden="true" />
          Recent Admin Actions
        </h2>
        {recentAdminActions.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">No recent admin actions.</p>
          </div>
        ) : (
          <div className="activity-log">
            <ul className="activity-list">
              {recentAdminActions.map((entry) => (
                <li className="activity-item" key={entry.logId}>
                  <time className="activity-time" dateTime={entry.createdAt}>
                    {dateFormatter.format(new Date(entry.createdAt))}
                  </time>
                  <p className="activity-desc">
                    <span className="activity-action">{entry.action}:</span>{" "}
                    {entry.details}
                  </p>
                </li>
              ))}
            </ul>
            <Button to={viewAllLogsAction.to} variant="secondary" size="sm">
              <ViewAllIcon aria-hidden="true" />
              {viewAllLogsAction.label}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
