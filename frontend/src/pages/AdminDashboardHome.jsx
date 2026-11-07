import { ChartNoAxesColumn, Logs } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import {
  adminInsights,
  recentAdminActionsPath,
  recentAdminActionsText,
  viewAllLogsAction,
} from "../data/adminDashboardData";
import { isPublicEvent } from "../lib/eventStatus";
import { countTrend, getRangeBounds } from "../lib/analytics";
import { isUpcoming, matchesWhen } from "../lib/eventDates";
import EmptyState from "../components/UI/EmptyState";
import LogEntry from "../components/dashboard/LogEntry";
import { describeLog, logLookup } from "../lib/systemLogs";
import { useApi } from "../lib/useApi";
import { daysSince, formatDateTime } from "../lib/formatDates";

// The four Quick Insights cards, from the shared users, events and messages
function getAdminInsights({ users, events, contactMessages }) {
  const now = new Date();
  const text = adminInsights;

  // Oldest first by when it was sent for review. A pending event that an
  // admin has already decided on once is a resubmission (schema rule)
  const pending = events
    .filter((event) => event.status === "pending")
    .sort((a, b) =>
      (a.orgUpdatedAt ?? a.createdAt).localeCompare(b.orgUpdatedAt ?? b.createdAt),
    );
  const resubmitted = pending.filter((event) => event.adminUpdatedAt).length;
  const oldestPending = pending[0];

  const unread = contactMessages
    .filter((message) => !message.readAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Sign-ups in the last 30 days against the 30 days before
  const signUps = countTrend(
    users,
    (user) => user.createdAt,
    getRangeBounds({ days: 30 }, now),
    now,
  );

  const live = events.filter((event) => isPublicEvent(event) && isUpcoming(event, now));
  const thisWeekend = live.filter((event) => matchesWhen(event, "weekend", now)).length;
  // Everything Manage Events lists: drafts stay with their organiser
  const listed = events.filter((event) => event.status !== "draft").length;

  return [
    {
      ...text.review,
      count: pending.length,
      action: oldestPending && {
        label: [
          text.review.oldest(
            daysSince(oldestPending.orgUpdatedAt ?? oldestPending.createdAt, now),
          ),
          resubmitted > 0 && `${resubmitted} ${text.review.resubmitted}`,
        ]
          .filter(Boolean)
          .join(" · "),
        to: text.review.to,
      },
      detail: text.review.none,
    },
    {
      ...text.messages,
      count: unread.length,
      action: unread[0] && {
        label: text.messages.oldest(daysSince(unread[0].createdAt, now)),
        to: text.messages.to,
      },
      detail: text.messages.none,
    },
    {
      ...text.newUsers,
      count: signUps.current,
      trend: {
        ...signUps,
        label: text.newUsers.total(users.length),
        note: text.newUsers.note(signUps.previous),
      },
    },
    {
      ...text.live,
      count: live.length,
      detail: `${text.live.total(listed)} · ${text.live.weekend(thisWeekend)}`,
    },
  ];
}

// `events` is the Manage Events list from the API (Phase 7) and `users` the
// Manage Users one (Phase 8). Recent Admin Actions are the newest log rows by
// admins (Phase 10), asked for as the page opens
export default function AdminDashboardHome({ users, events, contactMessages }) {
  const ViewAllIcon = viewAllLogsAction.icon;
  const insights = getAdminInsights({ users, events, contactMessages });
  const { payload: logPayload, error: logError } = useApi(recentAdminActionsPath);
  const recentAdminActions = logPayload?.data;

  return (
    <div className="dashboard-page">
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
          {insights.map((item) => (
            <DashboardCard key={item.title} item={item} />
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
        {logError ? (
          <EmptyState icon={Logs} text={recentAdminActionsText.loadError} />
        ) : !recentAdminActions ? null : recentAdminActions.length === 0 ? (
          <EmptyState icon={Logs} text={recentAdminActionsText.empty} />
        ) : (
          // Recent Admin Actions: the log list (its own card) and View All Logs under it
          <div className="w-full flex flex-col items-start gap-4">
            {/* The same entries as System Logs, with the day in the time */}
            <ul className="panel list-panel log-list">
              {recentAdminActions.map((log) => (
                <LogEntry
                  key={log.logId}
                  log={log}
                  description={describeLog(log, logLookup(log))}
                  time={formatDateTime(log.createdAt)}
                />
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
