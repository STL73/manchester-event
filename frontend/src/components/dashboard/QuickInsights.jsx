import { ChartNoAxesColumn } from "lucide-react";
import DashboardCard from "../UI/DashboardCard";

// Home's stat cards under their heading, the same on every role's Home.
// `gridClassName` widens the grid where a role has more cards (organisers' five)
export default function QuickInsights({ insights, gridClassName = "" }) {
  return (
    <section className="dashboard-section" aria-labelledby="quick-insights-title">
      <h2 className="dashboard-title" id="quick-insights-title">
        <ChartNoAxesColumn className="dashboard-title-icon" aria-hidden="true" />
        Quick Insights
      </h2>
      <div className={`dashboard-grid ${gridClassName}`}>
        {insights.map((item) => (
          <DashboardCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}
