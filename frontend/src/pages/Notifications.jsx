import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";
import Button from "../components/UI/Button";
import Pagination from "../components/UI/Pagination";
import Tooltip from "../components/UI/Tooltip";
import PeriodSwitcher from "../components/charts/PeriodSwitcher";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import { eventDetailsPath } from "../data/eventsData";
import {
  notificationActions,
  notificationGroup,
  notificationGroups,
  notificationTypes,
  notificationsEmpty,
  notificationsPageSize,
  notificationsPaging,
  notificationsSummary,
  notificationsView,
} from "../data/notificationsData";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const summaryDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// One row: collapsed to icon, subject and time; opening it shows the full
// message and, only when it is about an event, View event. Cancelled events
// open too, as on My Favourites: the schema keeps them viewable
function NotificationRow({ notification, group, isOpen, onToggle, onMarkRead }) {
  const { markRead, read, viewEvent } = notificationActions;
  const type = notificationTypes[notification.type];
  const isRead = Boolean(notification.readAt);
  const detailId = `notification-${notification.notificationId}`;
  const created = new Date(notification.createdAt);

  return (
    <li
      className={`notification-row ${isRead ? "" : "is-unread"} ${isOpen ? "is-open" : ""}`}
    >
      <div className="notification-row-head">
        <h3 className="notification-row-heading">
          <button
            className="notification-row-toggle"
            type="button"
            aria-expanded={isOpen}
            aria-controls={detailId}
            onClick={onToggle}
          >
            <span
              className={`notification-type-icon ${type.cancelled ? "is-cancelled" : ""}`}
            >
              <type.icon aria-hidden="true" />
            </span>
            <span className="notification-row-text">
              <span className="notification-row-subject">
                {!isRead && <span className="notification-unread-dot" aria-hidden="true" />}
                <span className="notification-row-subject-text">
                  {!isRead && <span className="sr-only">Unread: </span>}
                  {notification.subject}
                </span>
              </span>
              <time className="notification-row-time" dateTime={notification.createdAt}>
                {group === "today" ? timeFormatter.format(created) : dayFormatter.format(created)}
              </time>
            </span>
            <ChevronDown className="notification-row-chevron" aria-hidden="true" />
          </button>
        </h3>
        {isRead ? (
          <read.icon className="notification-read-icon" aria-hidden="true" />
        ) : (
          <Tooltip text={markRead.label}>
            <button
              className="notification-mark-read"
              type="button"
              aria-label={`${markRead.label}: ${notification.subject}`}
              onClick={() => onMarkRead([notification.notificationId])}
            >
              <markRead.icon className="notification-envelope-closed" aria-hidden="true" />
              <markRead.hoverIcon className="notification-envelope-open" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="notification-row-detail" id={detailId} hidden={!isOpen}>
        <p className="notification-row-body">{notification.body}</p>
        <div className="notification-row-foot">
          <span className="notification-row-type">{type.label}</span>
          {notification.eventId && (
            <Button
              to={eventDetailsPath(notification.eventId, true)}
              state={{ from: "/dashboard/notifications" }}
              variant="secondary"
              size="sm"
            >
              <viewEvent.icon aria-hidden="true" />
              {viewEvent.label}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

// Read state lives in App (read_at), so Home's unread card agrees with
// this page and marking one read survives leaving the page
export default function Notifications({ selectedUser, notifications: allNotifications, onMarkRead }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openId, setOpenId] = useState(null);
  // Read while the Unread view is showing: they stay on screen until the
  // view or page changes, so a message doesn't vanish as it is opened
  const [keptIds, setKeptIds] = useState([]);
  const listRef = useRef(null);

  const role = selectedUser?.type ?? "user";
  const notifications = allNotifications.filter(
    (notification) => notification.recipient === role,
  );
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const newest = notifications[0] && new Date(notifications[0].createdAt);
  const { markAllRead } = notificationActions;

  const showUnread = searchParams.get("show") === "unread";
  const visible = showUnread
    ? notifications.filter(
        (notification) => !notification.readAt || keptIds.includes(notification.notificationId),
      )
    : notifications;

  // The page lives in the URL, as on Explore Events; out-of-range numbers clamp
  const pageCount = Math.max(1, Math.ceil(visible.length / notificationsPageSize));
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * notificationsPageSize;
  const pageNotifications = visible.slice(firstIndex, firstIndex + notificationsPageSize);

  // Groups are built from this page only, so a group that runs over two
  // pages shows its heading again at the top of the next
  const now = new Date();
  const groups = Object.entries(notificationGroups)
    .map(([key, title]) => ({
      key,
      title,
      items: pageNotifications.filter(
        (notification) => notificationGroup(notification.createdAt, now) === key,
      ),
    }))
    .filter((group) => group.items.length > 0);

  // Opening a notification reads it, as opening an email does. One stays
  // open at a time so the page keeps its length
  function toggleRow(notification) {
    const opening = openId !== notification.notificationId;
    setOpenId(opening ? notification.notificationId : null);
    if (opening && !notification.readAt) markRead([notification.notificationId]);
  }

  function markRead(ids) {
    if (showUnread) setKeptIds((current) => [...current, ...ids]);
    onMarkRead(ids);
  }

  // Mark All empties the Unread view on purpose: nothing is left to keep
  function markAllAsRead() {
    setKeptIds([]);
    onMarkRead(notifications.map((notification) => notification.notificationId));
  }

  // A new view starts at page 1, like a new filter on Explore Events
  function handleViewChange(nextView) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextView === "unread") nextParams.set("show", "unread");
    else nextParams.delete("show");
    nextParams.delete("page");
    setSearchParams(nextParams);
    setKeptIds([]);
    setOpenId(null);
  }

  function handlePageChange(nextPage) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    else nextParams.delete("page");
    setSearchParams(nextParams);
    setKeptIds([]);
    setOpenId(null);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="notifications-title"
      >
        <DashboardPageHeading
          id="notifications-title"
          icon={Bell}
          title="Notifications"
          summary={
            unreadCount === 0 ? (
              notificationsSummary.caughtUp
            ) : (
              <>
                <strong>
                  {unreadCount} {notificationsSummary.unread}
                </strong>
                <span aria-hidden="true"> · </span>
                {notificationsSummary.newest} {summaryDateFormatter.format(newest)}
              </>
            )
          }
        >
          {notifications.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <markAllRead.icon aria-hidden="true" />
              {markAllRead.label}
            </Button>
          )}
        </DashboardPageHeading>

        {notifications.length > 0 && (
          <PeriodSwitcher
            label={notificationsView.label}
            options={[
              { value: "all", label: notificationsView.all },
              { value: "unread", label: notificationsView.unread(unreadCount) },
            ]}
            value={showUnread ? "unread" : "all"}
            onChange={handleViewChange}
            className="notification-view-switch"
          />
        )}

        {visible.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">
              {notifications.length === 0 ? notificationsEmpty : notificationsView.unreadEmpty}
            </p>
          </div>
        ) : (
          <div className="notification-groups" ref={listRef}>
            {groups.map((group) => (
              <section
                className="notification-group"
                aria-labelledby={`notification-group-${group.key}`}
                key={group.key}
              >
                <h2 className="notification-group-title" id={`notification-group-${group.key}`}>
                  {group.title}
                </h2>
                <ul className="notification-rows">
                  {group.items.map((notification) => (
                    <NotificationRow
                      key={notification.notificationId}
                      notification={notification}
                      group={group.key}
                      isOpen={openId === notification.notificationId}
                      onToggle={() => toggleRow(notification)}
                      onMarkRead={markRead}
                    />
                  ))}
                </ul>
              </section>
            ))}
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={handlePageChange}
              summary={notificationsPaging.showing(
                firstIndex + 1,
                firstIndex + pageNotifications.length,
                visible.length,
              )}
            />
          </div>
        )}
      </section>
    </div>
  );
}
