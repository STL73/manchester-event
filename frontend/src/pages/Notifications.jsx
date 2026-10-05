import { useState } from "react";
import { Bell, Inbox, Mail, MailOpen } from "lucide-react";
import Button from "../components/UI/Button";
import { eventDetailsPath } from "../data/eventsData";
import DashboardCard from "../components/UI/DashboardCard";
import {
  allNotifications,
  notificationActions,
  notificationTypeLabels,
  notificationsInsight,
} from "../data/notificationsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Notifications({ selectedUser, events }) {
  const role = selectedUser?.type ?? "user";
  const [readIds, setReadIds] = useState(
    () =>
      new Set(
        allNotifications
          .filter((notification) => notification.isRead)
          .map((notification) => notification.notificationId),
      ),
  );
  const notifications = allNotifications.filter(
    (notification) => notification.recipient === role,
  );
  const unreadCount = notifications.filter(
    (notification) => !readIds.has(notification.notificationId),
  ).length;
  const { markAllRead, markRead, viewEvent } = notificationActions;

  function markAsRead(notificationId) {
    setReadIds((currentIds) => new Set(currentIds).add(notificationId));
  }

  function markAllAsRead() {
    setReadIds(
      (currentIds) =>
        new Set([
          ...currentIds,
          ...notifications.map((notification) => notification.notificationId),
        ]),
    );
  }

  // Cancelled events stay viewable for their organiser only; the status
  // comes from the master events list
  function canViewEvent(notification) {
    const event = events.find((item) => item.eventId === notification.eventId);
    return event?.status !== "cancelled" || role === "organiser";
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="notifications-title"
      >
        <h2 className="dashboard-title" id="notifications-title">
          <Bell className="dashboard-title-icon" aria-hidden="true" />
          Notifications
        </h2>
        <div className="dashboard-grid">
          <DashboardCard item={{ ...notificationsInsight, count: unreadCount }} />
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="notifications-list-title"
      >
        <h2 className="dashboard-title" id="notifications-list-title">
          <Inbox className="dashboard-title-icon" aria-hidden="true" />
          Notifications List
        </h2>

        {notifications.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">No notifications yet.</p>
          </div>
        ) : (
          <>
            <div className="notification-toolbar">
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
            </div>

            <ul className="notification-list">
              {notifications.map((notification) => {
                const isRead = readIds.has(notification.notificationId);
                const StatusIcon = isRead ? MailOpen : Mail;

                return (
                  <li
                    className={`notification-card ${isRead ? "" : "is-unread"}`}
                    key={notification.notificationId}
                  >
                    <div className="notification-header">
                      <StatusIcon
                        className="notification-status-icon"
                        aria-hidden="true"
                      />
                      <h3 className="notification-subject">
                        <span className="sr-only">
                          {isRead ? "Read: " : "Unread: "}
                        </span>
                        {notification.subject}
                      </h3>
                    </div>
                    <p className="notification-body">{notification.body}</p>
                    <p className="notification-meta">
                      {notificationTypeLabels[notification.type]}
                      <span aria-hidden="true"> · </span>
                      <time dateTime={notification.scheduledAt}>
                        {dateFormatter.format(new Date(notification.scheduledAt))}
                      </time>
                    </p>

                    {(notification.eventId || !isRead) && (
                      <div className="notification-actions">
                        {notification.eventId &&
                          (canViewEvent(notification) ? (
                            <Button
                              to={eventDetailsPath(notification.eventId, true)}
                              state={{ from: "/dashboard/notifications" }}
                              variant="secondary"
                              size="sm"
                            >
                              <viewEvent.icon
                               
                                aria-hidden="true"
                              />
                              {viewEvent.label}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              title="Event cancelled"
                              disabled
                            >
                              <viewEvent.icon
                               
                                aria-hidden="true"
                              />
                              {viewEvent.label}
                            </Button>
                          ))}
                        {!isRead && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              markAsRead(notification.notificationId)
                            }
                          >
                            <markRead.icon
                             
                              aria-hidden="true"
                            />
                            {markRead.label}
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
