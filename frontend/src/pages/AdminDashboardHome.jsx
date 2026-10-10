import { ChartNoAxesColumn, Logs } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import {
  adminInsights,
  recentAdminActions,
  viewAllLogsAction,
} from "../data/adminDashboardData";
import { isPublicEvent } from "../data/eventsData";
import { countTrend, getRangeBounds } from "../lib/analytics";
import { isUpcoming, matchesWhen } from "../lib/eventDates";

const DAY = 24 * 60 * 60 * 1000;

function daysSince(date, now) {
  return Math.floor((now - new Date(date)) / DAY);
}

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
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

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
        label: text.messages.oldest(daysSince(unread[0].sentAt, now)),
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

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function AdminDashboardHome({ users, events, contactMessages }) {
  const ViewAllIcon = viewAllLogsAction.icon;
  const insights = getAdminInsights({ users, events, contactMessages });

  return (
    <div className="dashboard-home">
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
