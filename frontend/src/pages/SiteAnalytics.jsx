import { useState } from "react";
import DashboardCard from "../components/UI/DashboardCard";
import ChartCard from "../components/charts/ChartCard";
import CountBarChart from "../components/charts/CountBarChart";
import PeriodSwitcher from "../components/charts/PeriodSwitcher";
import TrendChart from "../components/charts/TrendChart";
import {
  countBy,
  countOverTime,
  getCardTrend,
  getRangeBounds,
  getSiteTotals,
} from "../lib/analytics";
import {
  accountStatusOrder,
  cardTrend,
  chartText,
  eventStatusOrder,
  statusColours,
} from "../data/analyticsData";
import { eventStatuses } from "../data/manageEventsData";
import { accountStatuses } from "../data/manageUsersData";
import { siteTotalsCards } from "../data/adminDashboardData";
import {
  defaultSiteRange,
  growthMetrics,
  siteAnalyticsCharts,
  siteAnalyticsSection,
  siteRangeOptions,
  siteTrendCards,
} from "../data/siteAnalyticsData";

const eventStatusLabels = Object.fromEntries(
  eventStatuses.map(({ value, label }) => [value, label]),
);
const accountStatusLabels = Object.fromEntries(
  accountStatuses.map(({ value, label }) => [value, label]),
);

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Admin analytics (admin_stats.php), counted live from the shared users and
// events lists, so it updates after Manage Users / Manage Events changes
export default function SiteAnalytics({ users, events }) {
  const [metricValue, setMetricValue] = useState(growthMetrics[0].value);
  const [rangeValue, setRangeValue] = useState(defaultSiteRange);
  const metric = growthMetrics.find((option) => option.value === metricValue);
  const range = siteRangeOptions.find((option) => option.value === rangeValue);
  const { growth, usersByRole, usersByStatus, eventsByStatus, eventsByCategory } =
    siteAnalyticsCharts;
  const SectionIcon = siteAnalyticsSection.icon;

  // Cards compare a fixed 30 days, whatever the chart's range shows
  const counts = getSiteTotals(users, events);
  const lists = { users, events };
  const cards = siteTotalsCards.map((card) => {
    const dateKey = siteTrendCards[card.id];
    return {
      ...card,
      count: counts[card.id],
      trend: dateKey && getCardTrend(lists[card.id], (item) => item[dateKey], cardTrend),
    };
  });

  // Matches get_user_trend_data() and get_events_trend_data(): by created date
  const growthRows = countOverTime(
    lists[metric.value],
    (item) => item.createdAt,
    range.period,
    { bounds: getRangeBounds(range) },
  );
  const roleRows = countBy(users, (user) => user.role, { getLabel: capitalise });
  const accountStatusRows = countBy(users, (user) => user.accStatus, {
    order: accountStatusOrder,
    getLabel: (status) => accountStatusLabels[status] ?? status,
  });
  // All events including drafts, as get_event_status_data() counted them
  const eventStatusRows = countBy(events, (event) => event.status, {
    order: eventStatusOrder,
    getLabel: (status) => eventStatusLabels[status] ?? status,
  });
  const categoryRows = countBy(events, (event) => event.category);

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="site-analytics-title"
      >
        <h2 className="dashboard-title" id="site-analytics-title">
          <SectionIcon className="dashboard-title-icon" aria-hidden="true" />
          {siteAnalyticsSection.title}
        </h2>

        <div className="dashboard-grid">
          {cards.map((card) => (
            <DashboardCard key={card.id} item={card} />
          ))}
        </div>

        <div className="analytics-grid">
          <ChartCard
            id="growth"
            rows={growthRows}
            wide
            {...growth}
            title={metric.title}
            description={`${metric.description} ${range.description}`}
            actions={
              <>
                <PeriodSwitcher
                  label={chartText.metric}
                  options={growthMetrics}
                  value={metricValue}
                  onChange={setMetricValue}
                />
                <PeriodSwitcher
                  label={chartText.range}
                  options={siteRangeOptions}
                  value={rangeValue}
                  onChange={setRangeValue}
                />
              </>
            }
          >
            <TrendChart rows={growthRows} valueLabel={metric.valueLabel} />
          </ChartCard>
          <ChartCard id="users-by-role" rows={roleRows} {...usersByRole}>
            <CountBarChart rows={roleRows} valueLabel="users" />
          </ChartCard>
          <ChartCard id="users-by-status" rows={accountStatusRows} {...usersByStatus}>
            <CountBarChart
              rows={accountStatusRows}
              colours={statusColours}
              valueLabel="users"
            />
          </ChartCard>
          <ChartCard id="events-by-status" rows={eventStatusRows} wide {...eventsByStatus}>
            <CountBarChart rows={eventStatusRows} colours={statusColours} />
          </ChartCard>
          <ChartCard id="events-by-category" rows={categoryRows} wide {...eventsByCategory}>
            <CountBarChart rows={categoryRows} horizontal />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
