import { Logs } from "lucide-react";

// System Logs: an activity feed by day, each entry a sentence (lib/systemLogs.js)
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
  loadError: "The logs couldn't be loaded. Check your connection and try again.",
  retry: "Try again",
};
