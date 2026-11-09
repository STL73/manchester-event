import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// The account's inbox, null until it arrives, kept by account id so a late answer
// never shows under the next. Read again as pages open: nothing pushes new ones
export function useNotifications(accountId) {
  const [inboxes, setInboxes] = useState({});
  const notifications = accountId === null ? null : (inboxes[accountId] ?? null);

  // If the inbox can't be read the pages keep what they had (none the first time)
  const loadNotifications = useCallback(() => {
    if (accountId === null) return;
    api("/users/me/notifications")
      .then(({ data }) => setInboxes((current) => ({ ...current, [accountId]: data })))
      .catch(() => setInboxes((current) => ({ ...current, [accountId]: current[accountId] ?? [] })));
  }, [accountId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Marks them read at once; if the server refuses, the inbox is read again so
  // it shows what is stored
  function markNotificationsRead(notificationIds) {
    const userId = accountId;
    const unread = (notifications ?? [])
      .filter((notification) => notificationIds.includes(notification.notificationId) && !notification.readAt)
      .map((notification) => notification.notificationId);
    if (unread.length === 0) return;
    const readAt = new Date().toISOString();
    setInboxes((current) => ({
      ...current,
      [userId]: current[userId].map((notification) =>
        unread.includes(notification.notificationId) ? { ...notification, readAt } : notification,
      ),
    }));
    api("/users/me/notifications/read", { method: "PUT", body: { ids: unread } }).catch(loadNotifications);
  }

  return { notifications, loadNotifications, markNotificationsRead };
}
