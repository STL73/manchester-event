import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toManagedEvent } from "../lib/managedEvents";
import { replaceById } from "../lib/replaceById";

// The admin's three lists, kept with the admin's id so a reply that lands
// after a log-out changes nothing: every event but drafts (Manage Events),
// every account (Manage Users, Admin Home's New users card) and every Contact
// form message (Contact Messages, Admin Home, the sidebar's unread count).
// Each is null until it arrives
export function useAdminLists(account, showError) {
  const adminUserId = account?.role === "admin" ? account.userId : null;
  const [adminLists, setAdminLists] = useState({ userId: null, events: null, users: null, messages: null });
  const adminListsLoaded = adminUserId !== null && adminLists.userId === adminUserId;
  const managedEvents = adminListsLoaded ? adminLists.events : null;
  const managedUsers = adminListsLoaded ? adminLists.users : null;
  const contactMessages = adminListsLoaded ? adminLists.messages : null;

  // If a list can't be read the pages show none, with the reason over the page
  useEffect(() => {
    if (adminUserId === null) return undefined;
    let current = true;
    Promise.all([api("/events/manage"), api("/users"), api("/contact-messages")]).then(
      ([managed, accounts, messages]) =>
        current &&
        setAdminLists({
          userId: adminUserId,
          events: managed.data.map(toManagedEvent),
          users: accounts.data,
          messages: messages.data,
        }),
      (error) => {
        if (!current) return;
        setAdminLists({ userId: adminUserId, events: [], users: [], messages: [] });
        showError(error.message);
      },
    );
    return () => {
      current = false;
    };
  }, [adminUserId, showError]);

  // Changes one list ("events", "users" or "messages") only while the lists
  // still belong to the same admin
  function updateList(adminId, name, change) {
    setAdminLists((current) => (current.userId === adminId ? { ...current, [name]: change(current[name]) } : current));
  }

  // Manage Events' decisions: "approve", "reject" or "take-down", the last two
  // with the reason the organiser reads. Awaits the server and throws its
  // ApiError for the panel to show; the list changes only once it agrees. The
  // server records who decided and tells everyone concerned
  async function decideEvent(eventId, decision, reason) {
    const adminId = adminUserId;
    const { data } = await api(`/events/${eventId}/${decision}`, {
      method: "PUT",
      body: reason === undefined ? undefined : { reason },
    });
    const decided = toManagedEvent(data);
    updateList(adminId, "events", (list) => replaceById(list, "eventId", decided));
  }

  // Manage Users. Each awaits the server and throws its ApiError for the
  // panel to show; the list changes only once it agrees
  async function deleteUser(userId) {
    const adminId = adminUserId;
    await api(`/users/${userId}`, { method: "DELETE" });
    updateList(adminId, "users", (list) => list.filter((user) => user.userId !== userId));
  }

  // { status: "active" } or { status: "suspended", reason, days }: 7, 30 or
  // null (until lifted), left out to keep the current end. The server works
  // out suspended_until and tells the person
  async function updateUserStatus(userId, body) {
    const adminId = adminUserId;
    const { data } = await api(`/users/${userId}/status`, { method: "PUT", body });
    updateList(adminId, "users", (list) => replaceById(list, "userId", data));
  }

  // Contact Messages: opening one reads it (read_at); Mark as unread clears
  // it. Changes at once, and reloads the list if the server refuses
  function setContactMessageRead(messageId, isRead) {
    const adminId = adminUserId;
    const readAt = isRead ? new Date().toISOString() : null;
    updateList(adminId, "messages", (list) =>
      list.map((item) => (item.messageId === messageId && Boolean(item.readAt) !== isRead ? { ...item, readAt } : item)),
    );
    api(`/contact-messages/${messageId}/read`, { method: "PUT", body: { read: isRead } }).catch(() =>
      api("/contact-messages").then(
        ({ data }) => updateList(adminId, "messages", () => data),
        () => {},
      ),
    );
  }

  // The server emails the reply and stores it (reply_body, replied_at,
  // replied_by). Awaits it and throws its ApiError for the panel to show
  async function replyToContactMessage(messageId, reply) {
    const adminId = adminUserId;
    const { data } = await api(`/contact-messages/${messageId}/reply`, { method: "PUT", body: { reply } });
    updateList(adminId, "messages", (list) => replaceById(list, "messageId", data));
  }

  return {
    managedEvents,
    managedUsers,
    contactMessages,
    decideEvent,
    deleteUser,
    updateUserStatus,
    setContactMessageRead,
    replyToContactMessage,
  };
}
