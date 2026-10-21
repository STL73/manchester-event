import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Heart } from "lucide-react";
import DashboardCard from "../components/UI/DashboardCard";
import FilterPills from "../components/UI/FilterPills";
import ChartCard from "../components/charts/ChartCard";
import ChartFacts from "../components/charts/ChartFacts";
import ChartList from "../components/charts/ChartList";
import DecisionChart from "../components/charts/DecisionChart";
import FunnelSteps from "../components/charts/FunnelSteps";
import FollowersHoneycomb from "../components/charts/FollowersHoneycomb";
import PeriodSwitcher from "../components/charts/PeriodSwitcher";
import ShareBar from "../components/charts/ShareBar";
import StatusDonut from "../components/charts/StatusDonut";
import TrendChart from "../components/charts/TrendChart";
import WeekTimeGrid from "../components/charts/WeekTimeGrid";
import {
  countBy,
  countOverTime,
  formatWait,
  formatWeekday,
  getAccountShares,
  getApprovalRecord,
  getBusiestSlot,
  getCardTrend,
  getDecisionRows,
  getOrganiserActivity,
  getRangeBounds,
  getSavesSummary,
  getSignUpFunnel,
  getSupplyAndDemand,
  getSupportSummary,
  getSuspensions,
  getWaitingLongest,
  getWeekTimeGrid,
  rankBySaves,
} from "../lib/analytics";
import { isUpcoming } from "../lib/eventDates";
import {
  cardTrend,
  chartText,
  emailTones,
  eventStatusOrder,
  replySpeedTones,
  roleTones,
  savesTrend,
  statusTones,
  weekGridText,
} from "../data/analyticsData";
import { allFollows, allSaves, signInLogs } from "../data/analyticsActivityData";
import { eventCategories, eventState } from "../data/eventsData";
import { eventStatuses } from "../data/manageEventsData";
import { accountStatuses } from "../data/manageUsersData";
import {
  daysAgo,
  defaultSiteRange,
  emailLabels,
  growthMetrics,
  replySpeedLabels,
  roleLabels,
  siteAnalyticsCards,
  siteAnalyticsCharts,
  siteAnalyticsSection,
  siteAnalyticsTabs,
  siteRangeOptions,
} from "../data/siteAnalyticsData";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";

const eventStatusLabels = Object.fromEntries(
  eventStatuses.map(({ value, label }) => [value, label]),
);
// Unverified isn't in accountStatuses (it can't be set), hence the extra entry
const accountStatusLabels = {
  ...Object.fromEntries(accountStatuses.map(({ value, label }) => [value, label])),
  unverified: "Unverified",
};

const DAY = 86400000;
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthName = new Intl.DateTimeFormat("en-GB", { month: "long" });

function withLabels(rows, labels) {
  return rows.map((row) => ({ ...row, label: labels[row.key] ?? row.key }));
}

// Waits from a day on are the warning colour, from three days the danger one
function waitTone(ms) {
  if (ms >= 3 * DAY) return "danger";
  return ms >= DAY ? "warning" : "muted";
}

// Admin analytics (admin_stats.php), counted live from the shared users,
// events and contact messages, so it updates after Manage Users, Manage
// Events and Contact Messages changes
export default function SiteAnalytics({ users, events, contactMessages, favouriteIds, interestIds }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = siteAnalyticsTabs.some((option) => option.value === tabParam)
    ? tabParam
    : siteAnalyticsTabs[0].value;
  const [metricValue, setMetricValue] = useState(growthMetrics[0].value);
  const [rangeValue, setRangeValue] = useState(defaultSiteRange);
  const metric = growthMetrics.find((option) => option.value === metricValue);
  const range = siteRangeOptions.find((option) => option.value === rangeValue);
  const charts = siteAnalyticsCharts;
  const SectionIcon = siteAnalyticsSection.icon;
  const now = new Date();

  const saves = allSaves(favouriteIds);
  const savesSummary = getSavesSummary(saves, now);
  const record = getApprovalRecord(events, now);
  const lists = { users, events, saves };

  // Cards compare a fixed 30 days, whatever the chart's range shows
  const showChange =
    savesSummary.change != null && savesSummary.previous30 >= savesTrend.minimumForChange;
  const cards = [
    {
      ...siteAnalyticsCards.users,
      id: "users",
      count: users.length,
      trend: getCardTrend(users, (user) => user.createdAt, cardTrend, now),
    },
    {
      ...siteAnalyticsCards.events,
      id: "events",
      count: events.length,
      trend: getCardTrend(events, (event) => event.createdAt, cardTrend, now),
    },
    {
      ...siteAnalyticsCards.saves,
      id: "saves",
      count: savesSummary.last30,
      trend: {
        current: savesSummary.last30,
        previous: savesSummary.previous30,
        label: showChange
          ? savesTrend.change(savesSummary.change)
          : savesTrend.previous(savesSummary.previous30),
        note: savesTrend.note(savesSummary.last30, savesSummary.previous30),
      },
    },
    {
      ...siteAnalyticsCards.reviewTime,
      id: "reviewTime",
      count: formatWait(record.averageWait),
    },
  ];

  // Growth: matches get_user_trend_data() and get_events_trend_data(), by
  // created date; saves by the date they were saved
  const growthRows = countOverTime(
    lists[metric.value],
    (item) => item.createdAt,
    range.period,
    { bounds: getRangeBounds(range, now) },
  );

  const funnel = getSignUpFunnel(users);
  const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
  const funnelSteps = [
    { key: "registered", label: charts.funnel.steps.registered, count: funnel.registered },
    {
      key: "verified",
      label: charts.funnel.steps.verified,
      count: funnel.verified,
      share: charts.funnel.share(percent(funnel.verified, funnel.registered)),
    },
    {
      key: "active",
      label: charts.funnel.steps.active,
      count: funnel.active,
      share: charts.funnel.share(percent(funnel.active, funnel.verified), charts.funnel.verifiedOf),
      tone: "success",
    },
  ];
  const neverVerified = funnel.registered - funnel.verified;

  const activity = getOrganiserActivity(users, events, now);
  const organiserItems = activity.top.map((row, index) => ({
    key: row.user.userId,
    lead: index + 1,
    title: row.user.username,
    detail: charts.organisers.detail(row.live, daysAgo((now - row.lastSubmitted) / DAY)),
    end: row.live,
  }));

  const shares = getAccountShares(users);
  // The data table lists all three bars, so each row names its bar
  const accountRows = [
    [charts.accounts.roles, withLabels(shares.roles, roleLabels)],
    [charts.accounts.statuses, withLabels(shares.statuses, accountStatusLabels)],
    [charts.accounts.emails, withLabels(shares.emails, emailLabels)],
  ].flatMap(([group, rows]) =>
    rows.map((row) => ({ ...row, key: `${group}-${row.key}`, label: `${group}: ${row.label}` })),
  );

  // Moderation: the last 6 months, by month
  const sixMonths = getRangeBounds({ months: 6 }, now);
  const decisionRows = getDecisionRows(events, "month", sixMonths);
  const hourRows = decisionRows.map((row) => ({ ...row, count: row.averageHours }));
  const [lastMonth, thisMonth] = decisionRows.slice(-2);
  const decided = decisionRows.reduce((sum, row) => sum + row.count, 0);
  const rejected = decisionRows.reduce((sum, row) => sum + row.rejected, 0);
  const { facts: timeFacts } = charts.decisionTime;
  const decisionFacts = [
    {
      label: timeFacts.thisMonth,
      value: thisMonth?.averageHours == null ? "–" : `${thisMonth.averageHours} h`,
      detail:
        lastMonth?.averageHours == null
          ? timeFacts.noDecisions
          : timeFacts.was(lastMonth.averageHours, monthName.format(lastMonth.key)),
    },
    {
      label: timeFacts.waiting,
      value: record.pending,
      detail: record.pending
        ? timeFacts.oldest(formatWait(record.oldestWait))
        : timeFacts.nothingWaiting,
      tone: record.pending ? "warning" : undefined,
    },
    {
      label: timeFacts.rejected,
      value: `${percent(rejected, decided)}%`,
      detail: timeFacts.rejectedDetail,
    },
  ];
  // eventState, so an approved event that has ended counts as past
  const eventStatusRows = countBy(events, (event) => eventState(event, now), {
    order: eventStatusOrder,
    getLabel: (status) => eventStatusLabels[status] ?? status,
  });
  const waitingItems = getWaitingLongest(events, now).map(({ event, wait }) => ({
    key: event.eventId,
    lead: <Clock aria-hidden="true" />,
    title: event.name,
    detail: charts.waiting.detail(
      event.organiser,
      shortDate.format(new Date(event.orgUpdatedAt ?? event.createdAt)),
    ),
    end: <span className={`badge tone-${waitTone(wait)}`}>{formatWait(wait)}</span>,
  }));

  // Engagement: what is public and still to come
  const upcoming = events.filter((event) => event.status === "approved" && isUpcoming(event, now));
  const supplyRows = getSupplyAndDemand(allFollows(interestIds), events, eventCategories, now).map(
    (row) => ({
      ...row,
      // For the data table: "–" where nothing is coming up to divide by
      perEventLabel: row.perEvent == null ? "–" : Math.round(row.perEvent * 10) / 10,
    }),
  );
  const mostSavedItems = rankBySaves(saves, upcoming).map(({ event, saves: count }, index) => ({
    key: event.eventId,
    lead: index + 1,
    title: event.name,
    detail: `${event.category} · ${shortDate.format(new Date(event.startDatetime))}`,
    end: (
      <>
        <Heart aria-hidden="true" />
        {count}
        <span className="sr-only">saves</span>
      </>
    ),
  }));
  const weekGrid = getWeekTimeGrid(upcoming);
  const weekRows = weekGrid.map((counts, day) => ({
    key: weekGridText.days[day],
    label: weekGridText.days[day],
    ...Object.fromEntries(counts.map((count, slot) => [weekGridText.slots[slot], count])),
  }));
  const busiest = getBusiestSlot(weekGrid);

  // Safety and support
  const failedRows = countOverTime(
    signInLogs.filter((log) => log.action === "User Login Failed"),
    (log) => log.createdAt,
    "day",
    { bounds: getRangeBounds({ days: 14 }, now) },
  );
  const spike = failedRows.reduce((top, row) => (row.count > (top?.count ?? 0) ? row : top), null);
  const suspensions = getSuspensions(users, now);
  const { facts: suspensionFacts } = charts.suspensions;
  const suspensionItems = suspensions.endingSoon.map((user) => {
    const left = new Date(user.suspendedUntil) - now;
    return {
      key: user.userId,
      lead: <Clock aria-hidden="true" />,
      title: user.username,
      detail: charts.suspensions.detail(
        user.suspensionReason,
        shortDate.format(new Date(user.suspendedUntil)),
      ),
      // Ending within 3 days: the account is back soon, worth a look
      end: (
        <span className={`badge tone-${left < 3 * DAY ? "warning" : "muted"}`}>
          {formatWait(left)}
        </span>
      ),
    };
  });
  const support = getSupportSummary(contactMessages, now);
  const { facts: supportFacts } = charts.support;

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
                {...charts.growth}
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
              <ChartCard id="sign-up-funnel" rows={users} table={false} {...charts.funnel}>
                <FunnelSteps steps={funnelSteps} />
                {neverVerified > 0 && <p className="chart-hint">{charts.funnel.never(neverVerified)}</p>}
              </ChartCard>
              <ChartCard
                id="organiser-activity"
                rows={organiserItems}
                table={false}
                {...charts.organisers}
                description={charts.organisers.description(activity.active, activity.organisers)}
              >
                <span className="meter">
                  <span style={{ width: `${percent(activity.active, activity.organisers)}%` }} />
                </span>
                <ChartList items={organiserItems} />
              </ChartCard>
              <ChartCard id="accounts" rows={accountRows} wide {...charts.accounts}>
                <div className="flex flex-col gap-5">
                  <ShareBar
                    title={charts.accounts.roles}
                    rows={withLabels(shares.roles, roleLabels)}
                    tones={roleTones}
                  />
                  <ShareBar
                    title={charts.accounts.statuses}
                    rows={withLabels(shares.statuses, accountStatusLabels)}
                    tones={statusTones}
                  />
                  <ShareBar
                    title={charts.accounts.emails}
                    rows={withLabels(shares.emails, emailLabels)}
                    tones={emailTones}
                    striped={["off"]}
                  />
                </div>
              </ChartCard>
            </>
          )}
          {tab === "moderation" && (
            <>
              <ChartCard id="time-to-decision" rows={hourRows} {...charts.decisionTime}>
                <div className="flex flex-col gap-4">
                  <ChartFacts facts={decisionFacts} />
                  <TrendChart rows={hourRows} valueLabel="hours" tone="warning" />
                </div>
              </ChartCard>
              <ChartCard id="review-decisions" rows={decisionRows} {...charts.decisions}>
                <DecisionChart rows={decisionRows} />
              </ChartCard>
              <ChartCard id="events-by-status" rows={eventStatusRows} {...charts.eventsByStatus}>
                <StatusDonut rows={eventStatusRows} tones={statusTones} unit="events" />
              </ChartCard>
              <ChartCard id="waiting-longest" rows={waitingItems} table={false} {...charts.waiting}>
                <ChartList items={waitingItems} />
              </ChartCard>
            </>
          )}
          {tab === "engagement" && (
            <>
              <ChartCard id="supply-and-demand" rows={supplyRows} wide interactive {...charts.supply}>
                <FollowersHoneycomb rows={supplyRows} text={charts.supply} />
              </ChartCard>
              <ChartCard id="most-saved" rows={mostSavedItems} table={false} {...charts.mostSaved}>
                <ChartList items={mostSavedItems} />
              </ChartCard>
              <ChartCard
                id="when-events-happen"
                rows={upcoming.length ? weekRows : []}
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
            </>
          )}
          {tab === "safety" && (
            <>
              <ChartCard id="failed-sign-ins" rows={failedRows} wide {...charts.failedSignIns}>
                <TrendChart
                  rows={failedRows}
                  valueLabel="failed sign-ins"
                  tone="danger"
                  callout={
                    spike && {
                      key: spike.key,
                      text: charts.failedSignIns.callout(spike.count, spike.label),
                    }
                  }
                />
              </ChartCard>
              <ChartCard id="suspensions" rows={users} table={false} {...charts.suspensions}>
                <ChartFacts
                  facts={[
                    {
                      label: suspensionFacts.suspended,
                      value: suspensions.total,
                      detail: suspensionFacts.indefinite(suspensions.indefinite),
                      tone: suspensions.total ? "danger" : undefined,
                    },
                    {
                      label: suspensionFacts.endingSoon,
                      value: suspensions.endingSoon.length,
                      detail: suspensionFacts.lifted,
                    },
                  ]}
                />
                {suspensionItems.length ? (
                  <ChartList items={suspensionItems} />
                ) : (
                  <p className="chart-hint">{charts.suspensions.none}</p>
                )}
              </ChartCard>
              <ChartCard id="support" rows={contactMessages} table={false} {...charts.support}>
                <ChartFacts
                  facts={[
                    {
                      label: supportFacts.averageReply,
                      value: formatWait(support.averageReply),
                      detail: supportFacts.averageDetail,
                    },
                    {
                      label: supportFacts.unread,
                      value: support.unread,
                      tone: support.unread ? "warning" : undefined,
                    },
                    {
                      label: supportFacts.overdue,
                      value: support.overdue,
                      detail: supportFacts.overdueDetail,
                      tone: support.overdue ? "danger" : undefined,
                    },
                  ]}
                />
                <ShareBar
                  title={charts.support.replySpeed}
                  rows={withLabels(support.replySpeed, replySpeedLabels)}
                  tones={replySpeedTones}
                />
              </ChartCard>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
