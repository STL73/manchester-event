import { Save, Trash2, Users } from "lucide-react";

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
  save: { label: "Save", icon: Save },
  delete: {
    text: "Delete the account and everything in it.",
    button: "Delete",
    icon: Trash2,
    question: "Delete this account for good?",
    keep: "Keep it",
    confirm: "Delete permanently",
  },
  noDelete: {
    admin: "Admin accounts can't be deleted here.",
    publicEvents: "Has public events, so it can only be suspended.",
  },
};

// Messages from manage_users_view, delete_user and edit_user PHP files
export const manageUsersMessages = {
  userDeleted: "Account deleted.",
  noUsers: "No users found.",
  noMatches: "No accounts match.",
  clear: "Clear search and filters",
  statusUpdated: "Account updated.",
};

// Mock of the users table. IDs rise with the sign-up date, as auto-increment
// IDs would; organisers 2 and 16 own some of the events in eventsData.js.
// emailNotifications is only written where it's off (the schema's default
// is on), for Site Analytics' email opt-outs.
const users = [
  {
    userId: 1,
    username: "adminName",
    email: "admin@email.com",
    role: "admin",
    accStatus: "active",
    emailVerifiedAt: "2026-01-05T09:00:00",
    createdAt: "2026-01-05T09:00:00",
    updatedAt: "2026-08-30T12:10:00",
  },
  {
    userId: 2,
    username: "quaysevents",
    email: "team@quaysevents.co.uk",
    role: "organiser",
    accStatus: "active",
    emailVerifiedAt: "2026-01-09T10:15:00",
    createdAt: "2026-01-09T10:15:00",
    updatedAt: "2026-09-15T11:45:00",
  },
  {
    userId: 3,
    username: "organiserName",
    email: "organiser@email.com",
    role: "organiser",
    accStatus: "active",
    emailVerifiedAt: "2026-02-11T15:32:00",
    createdAt: "2026-02-11T15:32:00",
    updatedAt: "2026-09-10T14:00:00",
  },
  {
    userId: 4,
    username: "oliviam",
    email: "olivia.m@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-02-18T19:40:00",
    createdAt: "2026-02-18T19:40:00",
    updatedAt: "2026-07-03T08:55:00",
  },
  {
    userId: 6,
    username: "dan.p",
    email: "dan.p@email.com",
    role: "user",
    accStatus: "suspended",
    emailVerifiedAt: "2026-03-02T12:05:00",
    suspendedUntil: "2026-10-26T09:00:00",
    suspensionReason: "Spam messages to organisers",
    createdAt: "2026-03-02T12:05:00",
    updatedAt: "2026-08-14T17:30:00",
  },
  {
    userId: 7,
    username: "userName",
    email: "user@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-03-14T10:22:00",
    createdAt: "2026-03-14T10:22:00",
    updatedAt: "2026-09-15T21:12:00",
  },
  {
    userId: 8,
    username: "priya_r",
    email: "priya.r@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-03-27T09:10:00",
    emailNotifications: false,
    createdAt: "2026-03-27T09:10:00",
    updatedAt: "2026-06-21T20:15:00",
  },
  {
    userId: 9,
    username: "mcrgigs",
    email: "hello@mcrgigs.co.uk",
    role: "organiser",
    accStatus: "suspended",
    emailVerifiedAt: "2026-04-02T11:45:00",
    suspendedUntil: null,
    suspensionReason: "Repeated listings with misleading dates",
    createdAt: "2026-04-02T11:45:00",
    updatedAt: "2026-09-12T14:20:00",
  },
  {
    userId: 11,
    username: "tomwright",
    email: "tom.wright@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-05-06T21:30:00",
    createdAt: "2026-05-06T21:30:00",
    updatedAt: "2026-05-06T21:30:00",
  },
  {
    userId: 13,
    username: "grace.h",
    email: "grace.h@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-05-30T13:25:00",
    emailNotifications: false,
    createdAt: "2026-05-30T13:25:00",
    updatedAt: "2026-09-02T10:40:00",
  },
  {
    userId: 14,
    username: "samk",
    email: "sam.k@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-06-19T18:03:00",
    createdAt: "2026-06-19T18:03:00",
    updatedAt: "2026-09-26T16:05:00",
  },
  {
    userId: 16,
    username: "northernfood",
    email: "hello@northernfood.co.uk",
    role: "organiser",
    accStatus: "active",
    emailVerifiedAt: "2026-07-14T08:50:00",
    createdAt: "2026-07-14T08:50:00",
    updatedAt: "2026-09-18T21:10:00",
  },
  {
    userId: 17,
    username: "leoevents",
    email: "leo@leoevents.co.uk",
    role: "organiser",
    accStatus: "active",
    emailVerifiedAt: "2026-08-19T16:35:00",
    createdAt: "2026-08-19T16:35:00",
    updatedAt: "2026-08-19T16:35:00",
  },
  {
    userId: 18,
    username: "salfordarts",
    email: "events@salfordarts.org",
    role: "organiser",
    accStatus: "active",
    emailVerifiedAt: "2026-09-22T08:40:00",
    createdAt: "2026-09-22T08:40:00",
    updatedAt: "2026-09-22T08:40:00",
  },
  {
    userId: 20,
    username: "mo_ali",
    email: "mo.ali@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: "2026-09-23T17:55:00",
    createdAt: "2026-09-23T17:55:00",
    updatedAt: "2026-09-24T09:05:00",
  },
  {
    userId: 22,
    username: "chloe.b",
    email: "chloe.b@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: null,
    emailNotifications: false,
    createdAt: "2026-09-25T11:20:00",
    updatedAt: "2026-09-25T11:20:00",
  },
  {
    userId: 23,
    username: "janedoe",
    email: "jane@email.com",
    role: "user",
    accStatus: "active",
    emailVerifiedAt: null,
    createdAt: "2026-09-26T18:22:00",
    updatedAt: "2026-09-26T18:22:00",
  },
];

// Matches get_all_users(): newest account first
export const mockUsers = [...users].sort((a, b) =>
  b.createdAt.localeCompare(a.createdAt),
);

