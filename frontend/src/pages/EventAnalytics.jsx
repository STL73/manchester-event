import { useState } from "react";
import { Heart } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import FilterPills from "../components/UI/FilterPills";
import ChartCard from "../components/charts/ChartCard";
import ChartFacts from "../components/charts/ChartFacts";
import ChartList from "../components/charts/ChartList";
import DateTile from "../components/UI/DateTile";
import CountBarChart from "../components/charts/CountBarChart";
import PeriodSwitcher from "../components/UI/PeriodSwitcher";
import ReachHoneycomb from "../components/charts/ReachHoneycomb";
import StatusDonut from "../components/charts/StatusDonut";
import TimelineChart from "../components/charts/TimelineChart";
import TrendChart from "../components/charts/TrendChart";
import WeekTimeGrid from "../components/charts/WeekTimeGrid";
import {
  countBy,
  countOverTime,
  formatWait,
  formatWeekday,
  getApprovalRecord,
  getBusiestSlot,
  getCategoryReach,
  getRangeBounds,
  getSavesSummary,
  getWeekTimeGrid,
  rankBySaves,
} from "../lib/analytics";
import { bySoonest, isUpcoming } from "../lib/eventDates";
import {
  analyticsLoadText,
  chartText,
  eventStatusOrder,
  savesTrend,
  statusTones,
  weekGridText,
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
import { eventCategories } from "../data/eventsData";
import { eventState, statusLabel } from "../lib/eventStatus";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import PageLoading from "../components/UI/PageLoading";
import StatusMessage from "../components/UI/StatusMessage";
import { useApi } from "../lib/useApi";
import { useUrlParams } from "../hooks/useUrlParams";
import { formatDayMonth, formatMonthLong, formatTime } from "../lib/formatDates";

const categoryNames = new Map(eventCategories.map((category) => [category.id, category.name]));
const UP_NEXT = 5;

// Organiser analytics (event_stats.php), counted in the browser from the
// organiser's events (App's, from the API) and the saves and followers the
// server sends as the page opens (Phase 10)
export default function EventAnalytics({ organiserEvents }) {
  const { searchParams, setParams } = useUrlParams();
  const tabParam = searchParams.get("tab");
  const tab = eventAnalyticsTabs.some((option) => option.value === tabParam)
    ? tabParam
    : eventAnalyticsTabs[0].value;
  const [rangeValue, setRangeValue] = useState(defaultEventRange);
  const range = eventRangeOptions.find((option) => option.value === rangeValue);
  const bounds = getRangeBounds(range);
  const charts = eventAnalyticsCharts;
  const SectionIcon = eventAnalyticsSection.icon;
  const now = new Date();
  // Saves on these events and their categories' followers (Phase 10); the
  // events themselves are App's, null until they arrive
  const { payload, error, retry } = useApi("/analytics/organiser");

  if (error) {
    return (
      <div className="dashboard-page">
        <StatusMessage variant="error">
          <p>{analyticsLoadText.error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={retry} className="self-start">
            {analyticsLoadText.retry}
          </Button>
        </StatusMessage>
      </div>
    );
  }
  if (!payload || !organiserEvents) return <PageLoading />;

  const eventById = new Map(organiserEvents.map((event) => [event.eventId, event]));
  const { saves, follows, audience } = payload.data;
  const savesPerEvent = countBy(saves, (save) => save.eventId);
  const savesOf = (eventId) => savesPerEvent.find((row) => row.key === eventId)?.count ?? 0;
  const savesSummary = getSavesSummary(saves, now);
  const record = getApprovalRecord(organiserEvents, now);

  // Reach is everyone who could hear about a new event: followers of any
  // category the organiser posts in, each person counted once (the server's
  // `audience`, since the follows come without who)
  const categoryIds = [...new Set(organiserEvents.map((event) => event.categoryId))];
  const reachRows = getCategoryReach(follows, categoryIds).map((row) => ({
    ...row,
    label: categoryNames.get(row.key) ?? row.key,
  }));

  const live = organiserEvents
    .filter((event) => event.status === "approved" && isUpcoming(event, now))
    .sort(bySoonest);

  // Saves: a percentage only when the 30 days before had enough to compare
  const showChange =
    savesSummary.change != null && savesSummary.previous30 >= savesTrend.minimumForChange;
  const savesContext = showChange
    ? savesTrend.change(savesSummary.change)
    : savesTrend.previous(savesSummary.previous30);

  const { live: liveCard, saves: savesCard, approval: approvalCard, reach: reachCard } =
    eventAnalyticsCards;
  const cards = [
    {
      ...liveCard,
      id: "live",
      count: live.length,
      detail: live.length ? liveCard.next(formatDayMonth(live[0].startDatetime)) : liveCard.none,
    },
    {
      ...savesCard,
      id: "saves",
      count: savesSummary.last30,
      trend: {
        current: savesSummary.last30,
        previous: savesSummary.previous30,
        label: savesContext,
        note: savesTrend.note(savesSummary.last30, savesSummary.previous30),
      },
    },
    {
      ...approvalCard,
      id: "approval",
      count: record.rate == null ? "–" : `${Math.round(record.rate * 100)}%`,
      detail: record.decided
        ? approvalCard.decided(record.approved, record.decided)
        : approvalCard.none,
    },
    {
      ...reachCard,
      id: "reach",
      count: audience,
      detail: reachCard.detail(categoryIds.length),
    },
  ];

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

  const upNextItems = live.slice(0, UP_NEXT).map((event) => ({
    key: event.eventId,
    lead: <DateTile date={event.startDatetime} />,
    title: event.name,
    detail: `${event.location} · ${formatTime(event.startDatetime)}`,
    end: <SaveCount count={savesOf(event.eventId)} />,
  }));

  // Saves by month over the last 6 months, the latest month labelled
  const saveRows = countOverTime(saves, (save) => save.createdAt, "month", {
    bounds: getRangeBounds({ months: 6 }, now),
  });
  const latestMonth = saveRows.at(-1);
  const saveFacts = [
    {
      label: charts.saves.facts.last30,
      value: savesSummary.last30,
      detail: savesContext,
    },
    {
      label: charts.saves.facts.allTime,
      value: savesSummary.allTime,
      detail: charts.saves.facts.events(savesPerEvent.length),
    },
    {
      label: charts.saves.facts.busiest,
      value:
        savesSummary.busiestDay == null
          ? charts.saves.facts.none
          : formatWeekday(savesSummary.busiestDay),
      detail:
        savesSummary.busiestDay == null
          ? undefined
          : charts.saves.facts.busiestShare(savesSummary.busiestShare),
    },
  ];
  const mostSavedItems = rankBySaves(saves, organiserEvents).map(({ event, saves: count }, index) => ({
    key: event.eventId,
    lead: index + 1,
    title: event.name,
    detail: `${statusLabel(eventState(event, now), "organiser")} · ${formatDayMonth(event.startDatetime)}`,
    end: <SaveCount count={count} />,
  }));
  const savesCategoryRows = countBy(saves, (save) => eventById.get(save.eventId)?.category);

  const { facts: approvalFacts } = charts.approval;
  const recordFacts = [
    {
      label: approvalFacts.approved,
      value: record.rate == null ? "–" : `${Math.round(record.rate * 100)}%`,
      detail: approvalFacts.decided(record.approved, record.decided),
      tone: record.rate == null ? undefined : "success",
    },
    {
      label: approvalFacts.wait,
      value: formatWait(record.averageWait),
      detail: approvalFacts.waitDetail,
    },
    {
      label: approvalFacts.waiting,
      value: record.pending,
      detail: record.pending
        ? approvalFacts.oldest(formatWait(record.oldestWait))
        : approvalFacts.nothingWaiting,
      tone: record.pending ? "warning" : undefined,
    },
  ];
  // eventState, so an approved event that has ended counts as past, as on
  // My Events' status pills
  const statusRows = countBy(organiserEvents, (event) => eventState(event, now), {
    order: eventStatusOrder,
    getLabel: (status) => statusLabel(status, "organiser"),
  });

  const weekGrid = getWeekTimeGrid(organiserEvents);
  const weekRows = weekGrid.map((counts, day) => ({
    key: weekGridText.days[day],
    label: weekGridText.days[day],
    ...Object.fromEntries(counts.map((count, slot) => [weekGridText.slots[slot], count])),
  }));
  const busiest = getBusiestSlot(weekGrid);
  const categoryRows = countBy(organiserEvents, (event) => event.category);
  const locationRows = countBy(organiserEvents, (event) => event.location);

  // The first section is the default, so it keeps the address clean
  function handleTabChange(nextTab) {
    setParams({ tab: nextTab === eventAnalyticsTabs[0].value ? null : nextTab });
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
            <>
              <ChartCard
                id="events-timeline"
                rows={timelineRows}
                wide
                {...charts.overTime}
                description={`${charts.overTime.description} ${range.description}`}
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
              <ChartCard
                id="up-next"
                rows={upNextItems}
                table={false}
                {...charts.upNext}
              >
                <ChartList items={upNextItems} />
                {live.length > UP_NEXT && (
                  <p className="chart-hint">{charts.upNext.more(live.length - UP_NEXT)}</p>
                )}
              </ChartCard>
              <ChartCard id="audience-reach" rows={reachRows} {...charts.reach}>
                <ReachHoneycomb rows={reachRows} />
              </ChartCard>
            </>
          )}
          {tab === "audience" && (
            <>
              <ChartCard id="saves" rows={saveRows} wide {...charts.saves}>
                <div className="flex flex-col gap-4">
                  <ChartFacts facts={saveFacts} />
                  <TrendChart
                    rows={saveRows}
                    valueLabel="saves"
                    smooth
                    callout={
                      latestMonth && {
                        key: latestMonth.key,
                        text: charts.saves.callout(latestMonth.count, formatMonthLong(latestMonth.key)),
                      }
                    }
                  />
                </div>
              </ChartCard>
              <ChartCard
                id="most-saved"
                rows={mostSavedItems}
                table={false}
                {...charts.mostSaved}
              >
                <ChartList items={mostSavedItems} />
              </ChartCard>
              <ChartCard id="saves-by-category" rows={savesCategoryRows} {...charts.savesByCategory}>
                <CountBarChart rows={savesCategoryRows} valueLabel="saves" />
              </ChartCard>
            </>
          )}
          {tab === "approval" && (
            <>
              <ChartCard
                id="approval-record"
                rows={organiserEvents}
                table={false}
                {...charts.approval}
              >
                <ChartFacts facts={recordFacts} />
                <div className="approval-reasons">
                  <p className="approval-reasons-title">{charts.approval.reasons}</p>
                  {record.latestRejections.length ? (
                    <ul>
                      {record.latestRejections.map((event) => (
                        <li key={event.eventId}>
                          <q>{event.rejectionReason}</q> · {event.name},{" "}
                          {formatDayMonth(event.adminUpdatedAt)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{charts.approval.noReasons}</p>
                  )}
                </div>
              </ChartCard>
              <ChartCard id="events-by-status" rows={statusRows} {...charts.byStatus}>
                <StatusDonut rows={statusRows} tones={statusTones} unit="events" />
              </ChartCard>
            </>
          )}
          {tab === "what-where" && (
            <>
              <ChartCard
                id="when-events-happen"
                rows={organiserEvents.length ? weekRows : []}
                wide
                {...charts.when}
                columns={weekGridText.slots.map((slot) => ({ key: slot, heading: slot }))}
              >
                <div className="flex flex-col gap-3">
                  <WeekTimeGrid grid={weekGrid} />
                  {busiest && (
                    <p className="chart-hint">
                      {charts.when.busiest(
                        formatWeekday((busiest.day + 1) % 7),
                        weekGridText.slots[busiest.slot].toLowerCase(),
                      )}
                    </p>
                  )}
                </div>
              </ChartCard>
              <ChartCard id="events-by-category" rows={categoryRows} {...charts.byCategory}>
                <CountBarChart rows={categoryRows} />
              </ChartCard>
              <ChartCard id="events-by-location" rows={locationRows} {...charts.byLocation}>
                <CountBarChart rows={locationRows} />
              </ChartCard>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function SaveCount({ count }) {
  return (
    <>
      <Heart aria-hidden="true" />
      {count}
      <span className="sr-only">saves</span>
    </>
  );
}
