import { Logs } from "lucide-react";

// System Logs (decided 2026-10-12, layout A): an activity feed grouped by
// day, each entry a sentence (lib/systemLogs.js) with links to what it names
export const systemLogsSection = { title: "System Logs", icon: Logs };

export const systemLogsPage = {
  summary: {
    entries: (count) => (count === 1 ? "entry" : "entries"),
    newest: "newest",
    failed: (count) => `failed sign-${count === 1 ? "in" : "ins"}`,
  },
  searchPlaceholder: "Search a name, event or action…",
  pageSize: 25,
  paging: (from, to, total) => `Showing ${from}–${to} of ${total} entries`,
  days: { today: "Today", yesterday: "Yesterday" },
  failedSignIn: "Failed sign-in",
  failedFor: "for",
};

// The pills above the feed. Kinds come from describeLog()
export const logViews = {
  label: "Show entries",
  options: [
    { value: "all", label: "All" },
    { value: "events", label: "Events" },
    { value: "accounts", label: "Accounts" },
    { value: "signins", label: "Sign-ins" },
    { value: "failed", label: "Failed sign-ins", tone: "danger" },
    { value: "admin", label: "Admins only" },
  ],
};

export const systemLogsMessages = {
  noLogs: "No system logs yet.",
  noMatches: "No entries match.",
  clear: "Clear search and filters",
};

// Matches get_system_logs(): newest first, limit 100
export const systemLogsLimit = 100;

// Mock of the system_logs table: username and role are copies taken at the
// time (the schema's columns), details is the jsonb. Actions keep the names
// from the PHP log_system_action() calls; users match the Manage Users mock
// (21 is a since-deleted user, so its row has no user to link to)
const logs = [
  { logId: 1, userId: 1, username: "adminName", role: "admin", action: "Event Status Changed", details: { eventId: 2, status: "approved" }, createdAt: "2026-09-27T10:42:00" },
  { logId: 2, userId: 1, username: "adminName", role: "admin", action: "User Login", details: null, createdAt: "2026-09-27T10:38:00" },
  { logId: 3, userId: 3, username: "organiserName", role: "organiser", action: "Event Created", details: { eventId: 9, name: "Ancoats Street Food Social", status: "draft" }, createdAt: "2026-09-27T09:20:00" },
  { logId: 4, userId: 7, username: "userName", role: "user", action: "Favourite Added", details: { eventId: 6 }, createdAt: "2026-09-26T21:05:00" },
  { logId: 5, userId: 3, username: "organiserName", role: "organiser", action: "Event Created", details: { eventId: 6, name: "People of Manchester", status: "pending" }, createdAt: "2026-09-26T20:10:00" },
  { logId: 6, userId: 23, username: "janedoe", role: "user", action: "User Registered", details: { email: "jane@email.com", role: "user" }, createdAt: "2026-09-26T18:22:00" },
  { logId: 7, userId: 1, username: "adminName", role: "admin", action: "User Status Changed", details: { userId: 14, status: "active" }, createdAt: "2026-09-26T16:05:00" },
  { logId: 8, userId: 9, username: "mcrgigs", role: "organiser", action: "User Login Failed", details: { reason: "Incorrect password", ip: "81.2.69.160" }, createdAt: "2026-09-26T08:47:00" },
  { logId: 9, userId: 1, username: "adminName", role: "admin", action: "Event Status Changed", details: { eventId: 7, status: "rejected", reason: "The ticket link goes to a 404 page." }, createdAt: "2026-09-25T09:30:00" },
  { logId: 10, userId: 3, username: "organiserName", role: "organiser", action: "Draft Submitted", details: { eventId: 2 }, createdAt: "2026-09-23T14:32:00" },
  { logId: 11, userId: 18, username: "salfordarts", role: "organiser", action: "User Registered", details: { email: "events@salfordarts.org", role: "organiser" }, createdAt: "2026-09-22T08:40:00" },
  { logId: 12, userId: 7, username: "userName", role: "user", action: "Preferences Updated", details: { categories: ["music", "community-culture"] }, createdAt: "2026-09-21T19:15:00" },
  { logId: 13, userId: 3, username: "organiserName", role: "organiser", action: "Event Cancelled", details: { eventId: 5 }, createdAt: "2026-09-20T09:00:00" },
  { logId: 14, userId: 3, username: "organiserName", role: "organiser", action: "Event Updated", details: { eventId: 5, name: "Manchester Active Weekend" }, createdAt: "2026-09-18T12:00:00" },
  { logId: 15, userId: 1, username: "adminName", role: "admin", action: "User Deleted", details: { userId: 21, username: "tom.b" }, createdAt: "2026-09-18T11:47:00" },
  { logId: 16, userId: 7, username: "userName", role: "user", action: "Password Changed", details: null, createdAt: "2026-09-15T21:12:00" },
  { logId: 17, userId: 14, username: "samk", role: "user", action: "Avatar Updated", details: null, createdAt: "2026-09-14T17:30:00" },
  { logId: 18, userId: 1, username: "adminName", role: "admin", action: "User Status Changed", details: { userId: 9, status: "suspended", reason: "Repeated listings with misleading dates" }, createdAt: "2026-09-12T14:20:00" },
  { logId: 19, userId: 7, username: "userName", role: "user", action: "Favourite Removed", details: { eventId: 2 }, createdAt: "2026-09-10T20:02:00" },
  { logId: 20, userId: 9, username: "mcrgigs", role: "organiser", action: "Event Deleted", details: { eventId: 11, name: "Canal Street Pop-up" }, createdAt: "2026-09-05T13:25:00" },
  { logId: 21, userId: 7, username: "userName", role: "user", action: "User Logout", details: null, createdAt: "2026-09-01T22:40:00" },
];

export const systemLogs = [...logs]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, systemLogsLimit);
