import { Save, Trash2, Users } from "lucide-react";
import { formatDayMonth } from "../lib/formatDates";

// Manage Users (decided 2026-10-12, layout A): the accounts as a list, each
// opening in a side panel. The schema's acc_status is active | suspended;
// an unverified email (email_verified_at NULL) is a label, not a status,
// because only the user can verify it
export const manageUsersPage = {
  title: "Manage Users",
  icon: Users,
  summary: {
    accounts: (count) => (count === 1 ? "account" : "accounts"),
    suspended: "suspended",
    unverified: (count) => `${count} ${count === 1 ? "hasn't" : "haven't"} verified their email`,
  },
  searchPlaceholder: "Search names or emails…",
  pageSize: 15,
  paging: (from, to, total) => `Showing ${from}–${to} of ${total} accounts`,
  you: "(you)",
  manage: "Manage",
  joined: "Joined",
  eventsCount: (count) => `${count} ${count === 1 ? "event" : "events"}`,
};

// The pills above the list: by role, then the two states worth finding
export const userViews = {
  label: "Show accounts",
  options: [
    { value: "all", label: "All" },
    { value: "user", label: "Users" },
    { value: "organiser", label: "Organisers" },
    { value: "admin", label: "Admins" },
    { value: "suspended", label: "Suspended" },
    { value: "unverified", label: "Unverified" },
  ],
};

export const userSortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A-Z" },
];

export const roleLabels = { user: "User", organiser: "Organiser", admin: "Admin" };

// Matches the options in render_edit_user_form(), less "pending"
export const accountStatuses = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

// Suspension length: suspended_until, or NULL until an admin lifts it
export const suspensionLengths = [
  { value: "7", label: "7 days", days: 7 },
  { value: "30", label: "30 days", days: 30 },
  { value: "open", label: "Until I lift it", days: null },
];

// The side panel
export const userPanel = {
  title: "Manage account",
  verified: { title: "Email verified", text: "Verified when they signed up." },
  unverified: {
    title: "Email not verified yet",
    text: "They can browse and save events, but can't submit events or get emails until they verify. Only they can do this.",
  },
  events: (count) => `${count} ${count === 1 ? "event" : "events"}`,
  eventsNone: "None yet",
  eventsPublic: "Some have been public, so the account can't be deleted.",
  statusLabel: "Account status",
  lengthLabel: "For how long",
  reasonLabel: "Reason",
  reasonHint: "shown to them",
  reasonPlaceholder: "e.g. Listings with misleading dates",
  reasonRequired: "Say why, so they know what to change.",
  suspendedNote: {
    user: "They can still sign in and read, with a banner saying why.",
    organiser: "They can still sign in and read, with a banner saying why. Their events are hidden from Explore while suspended.",
  },
  suspendedUntil: (date) => `Suspended until ${date}`,
  suspendedOpen: "Suspended until lifted",
  self: "This is your account. Change it on Settings.",
  // Admin accounts come from the seed and aren't suspended or deleted here
  // (decided 2026-11-03)
  adminTarget: "Admin accounts can't be changed here.",
  save: { label: "Save", icon: Save },
  delete: {
    text: "Delete the account and everything in it.",
    button: "Delete",
    icon: Trash2,
    question: "Delete this account for good?",
    keep: "Keep it",
    confirm: "Delete permanently",
  },
  noDelete: "Has public events, so it can only be suspended.",
};

// Messages from manage_users_view, delete_user and edit_user PHP files
export const manageUsersMessages = {
  userDeleted: "Account deleted.",
  noUsers: "No users found.",
  noMatches: "No accounts match.",
  clear: "Clear search and filters",
  statusUpdated: "Account updated.",
};

// "Suspended until 14 Nov" or "Suspended until lifted"; "" for an active account.
// Manage Users' rows and panel, and the form's Keep option
export function suspensionText(user) {
  if (user.accStatus !== "suspended") return "";
  return user.suspendedUntil
    ? userPanel.suspendedUntil(formatDayMonth(user.suspendedUntil))
    : userPanel.suspendedOpen;
}
