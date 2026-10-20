import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardCard from "../components/UI/DashboardCard";
import FilterPills from "../components/UI/FilterPills";
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
  statusTones,
} from "../data/analyticsData";
import { eventStatuses } from "../data/manageEventsData";
import { accountStatuses } from "../data/manageUsersData";
import { siteTotalsCards } from "../data/adminDashboardData";
import {
  defaultSiteRange,
  growthMetrics,
  siteAnalyticsCharts,
  siteAnalyticsSection,
  siteAnalyticsTabs,
  siteRangeOptions,
  siteTrendCards,
} from "../data/siteAnalyticsData";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = siteAnalyticsTabs.some((option) => option.value === tabParam)
    ? tabParam
    : siteAnalyticsTabs[0].value;
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
  // Unverified is a label, not a status (emailVerifiedAt NULL), but the admin
  // still needs to see it; a suspended account counts as suspended either way
  const accountStatusRows = countBy(
    users,
    (user) => {
      if (user.accStatus === "suspended") return "suspended";
      return user.emailVerifiedAt ? "active" : "unverified";
    },
    {
      order: accountStatusOrder,
      // Unverified isn't in accountStatuses (it can't be set), hence the fallback
      getLabel: (status) => accountStatusLabels[status] ?? capitalise(status),
    },
  );
  // All events including drafts, as get_event_status_data() counted them
  const eventStatusRows = countBy(events, (event) => event.status, {
    order: eventStatusOrder,
    getLabel: (status) => eventStatusLabels[status] ?? status,
  });
  const categoryRows = countBy(events, (event) => event.category);

  // The first section is the default, so it keeps the address clean
  function handleTabChange(nextTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === siteAnalyticsTabs[0].value) nextParams.delete("tab");
    else nextParams.set("tab", nextTab);
    setSearchParams(nextParams);
  }

  return (
    <div className="dashboard-page">
      <section
        className="dashboard-section"
        aria-labelledby="site-analytics-title"
      >
        <DashboardPageHeading
          id="site-analytics-title"
          icon={SectionIcon}
          title={siteAnalyticsSection.title}
        />

        <div className="dashboard-grid">
          {cards.map((card) => (
            <DashboardCard key={card.id} item={card} />
          ))}
        </div>

        <div className="w-full">
          <FilterPills
            label={chartText.sections}
            options={siteAnalyticsTabs}
            value={tab}
            onChange={handleTabChange}
          />
        </div>

        <div className="analytics-grid">
          {tab === "growth" && (
            <>
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
            </>
          )}
          {tab === "moderation" && (
            <ChartCard id="events-by-status" rows={eventStatusRows} wide {...eventsByStatus}>
              <CountBarChart rows={eventStatusRows} tones={statusTones} />
            </ChartCard>
          )}
          {tab === "engagement" && (
            <ChartCard id="events-by-category" rows={categoryRows} wide {...eventsByCategory}>
              <CountBarChart rows={categoryRows} horizontal />
            </ChartCard>
          )}
          {tab === "safety" && (
            <ChartCard id="users-by-status" rows={accountStatusRows} {...usersByStatus}>
              <CountBarChart
                rows={accountStatusRows}
                tones={statusTones}
                valueLabel="users"
              />
            </ChartCard>
          )}
        </div>
      </section>
    </div>
  );
}
