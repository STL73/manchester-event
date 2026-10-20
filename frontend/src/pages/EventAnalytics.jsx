import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardCard from "../components/UI/DashboardCard";
import FilterPills from "../components/UI/FilterPills";
import ChartCard from "../components/charts/ChartCard";
import CountBarChart from "../components/charts/CountBarChart";
import PeriodSwitcher from "../components/charts/PeriodSwitcher";
import TimelineChart from "../components/charts/TimelineChart";
import { countBy, countOverTime, getCardTrend, getRangeBounds } from "../lib/analytics";
import {
  cardTrend,
  chartText,
  eventStatusOrder,
  statusTones,
} from "../data/analyticsData";
import {
  defaultEventRange,
  eventAnalyticsCards,
  eventAnalyticsCharts,
  eventAnalyticsSection,
  eventAnalyticsTabs,
  eventRangeOptions,
  timelineSeries,
  timelineStatuses,
} from "../data/eventAnalyticsData";
import { eventStatuses } from "../data/manageEventsData";
import { organiserStatusLabels } from "../data/organiserEventsData";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";

// Organisers see "approved" as "Live", as on My Events and Event details
const statusLabels = Object.fromEntries(
  eventStatuses.map(({ value, label }) => {
    const organiserLabel = organiserStatusLabels[value];
    return [value, organiserLabel ? capitalise(organiserLabel) : label];
  }),
);

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Organiser analytics (event_stats.php), counted live from the shared
// organiser events list, so it updates when events are created or deleted
export default function EventAnalytics({ organiserEvents }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = eventAnalyticsTabs.some((option) => option.value === tabParam)
    ? tabParam
    : eventAnalyticsTabs[0].value;
  const [rangeValue, setRangeValue] = useState(defaultEventRange);
  const range = eventRangeOptions.find((option) => option.value === rangeValue);
  const bounds = getRangeBounds(range);
  const { overTime, byStatus, byCategory, byLocation } = eventAnalyticsCharts;
  const SectionIcon = eventAnalyticsSection.icon;

  // Matches get_upcoming_events_count() and get_events_this_month()
  const now = new Date();
  const counts = {
    total: organiserEvents.length,
    pending: organiserEvents.filter((event) => event.status === "pending").length,
    upcoming: organiserEvents.filter((event) => new Date(event.startDatetime) > now)
      .length,
    thisMonth: organiserEvents.filter((event) => {
      const start = new Date(event.startDatetime);
      return (
        start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth()
      );
    }).length,
  };
  // Total Events gets the fixed 30-day trend (events created), whatever the
  // timeline's range shows
  const cards = eventAnalyticsCards.map((card) => ({
    ...card,
    count: counts[card.id],
    trend:
      card.id === "total"
        ? getCardTrend(organiserEvents, (event) => event.createdAt, cardTrend, now)
        : undefined,
  }));

  // Replaces get_events_over_time(): events that did or will take place, by
  // start date, split into held (started before now) and scheduled
  const timelineRows = countOverTime(
    organiserEvents.filter((event) => timelineStatuses.includes(event.status)),
    (event) => event.startDatetime,
    range.period,
    {
      bounds,
      series: timelineSeries.map(({ key }) => key),
      getSeries: (event) => (new Date(event.startDatetime) < now ? "held" : "scheduled"),
    },
  );
  // The last bucket that starts on or before today holds today
  const todayRow = timelineRows.filter((row) => row.key <= now.getTime()).at(-1);
  const statusRows = countBy(organiserEvents, (event) => event.status, {
    order: eventStatusOrder,
    getLabel: (status) => statusLabels[status] ?? status,
  });
  const categoryRows = countBy(organiserEvents, (event) => event.category);
  const locationRows = countBy(organiserEvents, (event) => event.location);

  // The first section is the default, so it keeps the address clean
  function handleTabChange(nextTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === eventAnalyticsTabs[0].value) nextParams.delete("tab");
    else nextParams.set("tab", nextTab);
    setSearchParams(nextParams);
  }

  return (
    <div className="dashboard-page">
      <section
        className="dashboard-section"
        aria-labelledby="event-analytics-title"
      >
        <DashboardPageHeading
          id="event-analytics-title"
          icon={SectionIcon}
          title={eventAnalyticsSection.title}
        />

        <div className="dashboard-grid">
          {cards.map((card) => (
            <DashboardCard key={card.id} item={card} />
          ))}
        </div>

        <div className="w-full">
          <FilterPills
            label={chartText.sections}
            options={eventAnalyticsTabs}
            value={tab}
            onChange={handleTabChange}
          />
        </div>

        <div className="analytics-grid">
          {tab === "overview" && (
            <ChartCard
              id="events-timeline"
              rows={timelineRows}
              wide
              {...overTime}
              description={`${overTime.description} ${range.description}`}
              columns={timelineSeries.map(({ key, label }) => ({ key, heading: label }))}
              actions={
                <PeriodSwitcher
                  label={chartText.range}
                  options={eventRangeOptions}
                  value={rangeValue}
                  onChange={setRangeValue}
                />
              }
            >
              <TimelineChart
                rows={timelineRows}
                series={timelineSeries}
                todayLabel={todayRow?.label}
              />
            </ChartCard>
          )}
          {tab === "approval" && (
            <ChartCard id="events-by-status" rows={statusRows} wide {...byStatus}>
              <CountBarChart rows={statusRows} tones={statusTones} />
            </ChartCard>
          )}
          {tab === "what-where" && (
            <>
              <ChartCard id="events-by-category" rows={categoryRows} {...byCategory}>
                <CountBarChart rows={categoryRows} horizontal />
              </ChartCard>
              <ChartCard id="events-by-location" rows={locationRows} {...byLocation}>
                <CountBarChart rows={locationRows} />
              </ChartCard>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
