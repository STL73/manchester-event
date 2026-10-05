import { ChevronLeft, ClipboardList, ClipboardPen, Save, Trash2 } from "lucide-react";

export const manageUsersActions = [
  { label: "Manage Events", to: "/dashboard/manage-events", icon: ClipboardList },
];

export const userTableColumns = [
  "ID",
  "Username",
  "Email",
  "Role",
  "Account Status",
  "Dates",
  "Actions",
];

// Matches the options in render_edit_user_form()
export const accountStatuses = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

export const userActions = {
  edit: { label: "Edit", tooltip: "Edit account status", icon: ClipboardPen },
  delete: { label: "Delete", tooltip: "Delete user", icon: Trash2 },
  goBack: { label: "Go Back", to: "/dashboard/manage-users", icon: ChevronLeft },
  updateStatus: { label: "Update Status", icon: Save },
};

// Messages from manage_users_view, delete_user and edit_user PHP files
export const manageUsersMessages = {
  confirmDelete: "Are you sure you want to delete this user?",
  userDeleted: "User deleted successfully!",
  noUsers: "No users found.",
  userNotFound: "User not found.",
  statusUpdated: "User status updated successfully.",
};

// Mock of the users table. IDs rise with the sign-up date, as auto-increment
// IDs would; organisers 2 and 16 own some of the events in eventsData.js.
const users = [
  {
    userId: 1,
    username: "adminName",
    email: "admin@email.com",
    role: "admin",
    accStatus: "active",
    createdAt: "2026-01-05T09:00:00",
    updatedAt: "2026-08-30T12:10:00",
  },
  {
    userId: 2,
    username: "quaysevents",
    email: "team@quaysevents.co.uk",
    role: "organiser",
    accStatus: "active",
    createdAt: "2026-01-09T10:15:00",
    updatedAt: "2026-09-15T11:45:00",
  },
  {
    userId: 3,
    username: "organiserName",
    email: "organiser@email.com",
    role: "organiser",
    accStatus: "active",
    createdAt: "2026-02-11T15:32:00",
    updatedAt: "2026-09-10T14:00:00",
  },
  {
    userId: 4,
    username: "oliviam",
    email: "olivia.m@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-02-18T19:40:00",
    updatedAt: "2026-07-03T08:55:00",
  },
  {
    userId: 6,
    username: "dan.p",
    email: "dan.p@email.com",
    role: "user",
    accStatus: "suspended",
    createdAt: "2026-03-02T12:05:00",
    updatedAt: "2026-08-14T17:30:00",
  },
  {
    userId: 7,
    username: "userName",
    email: "user@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-03-14T10:22:00",
    updatedAt: "2026-09-15T21:12:00",
  },
  {
    userId: 8,
    username: "priya_r",
    email: "priya.r@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-03-27T09:10:00",
    updatedAt: "2026-06-21T20:15:00",
  },
  {
    userId: 9,
    username: "mcrgigs",
    email: "hello@mcrgigs.co.uk",
    role: "organiser",
    accStatus: "suspended",
    createdAt: "2026-04-02T11:45:00",
    updatedAt: "2026-09-12T14:20:00",
  },
  {
    userId: 11,
    username: "tomwright",
    email: "tom.wright@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-05-06T21:30:00",
    updatedAt: "2026-05-06T21:30:00",
  },
  {
    userId: 13,
    username: "grace.h",
    email: "grace.h@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-05-30T13:25:00",
    updatedAt: "2026-09-02T10:40:00",
  },
  {
    userId: 14,
    username: "samk",
    email: "sam.k@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-06-19T18:03:00",
    updatedAt: "2026-09-26T16:05:00",
  },
  {
    userId: 16,
    username: "northernfood",
    email: "hello@northernfood.co.uk",
    role: "organiser",
    accStatus: "active",
    createdAt: "2026-07-14T08:50:00",
    updatedAt: "2026-09-18T21:10:00",
  },
  {
    userId: 17,
    username: "leoevents",
    email: "leo@leoevents.co.uk",
    role: "organiser",
    accStatus: "pending",
    createdAt: "2026-08-19T16:35:00",
    updatedAt: "2026-08-19T16:35:00",
  },
  {
    userId: 18,
    username: "salfordarts",
    email: "events@salfordarts.org",
    role: "organiser",
    accStatus: "pending",
    createdAt: "2026-09-22T08:40:00",
    updatedAt: "2026-09-22T08:40:00",
  },
  {
    userId: 20,
    username: "mo_ali",
    email: "mo.ali@email.com",
    role: "user",
    accStatus: "active",
    createdAt: "2026-09-23T17:55:00",
    updatedAt: "2026-09-24T09:05:00",
  },
  {
    userId: 22,
    username: "chloe.b",
    email: "chloe.b@email.com",
    role: "user",
    accStatus: "pending",
    createdAt: "2026-09-25T11:20:00",
    updatedAt: "2026-09-25T11:20:00",
  },
  {
    userId: 23,
    username: "janedoe",
    email: "jane@email.com",
    role: "user",
    accStatus: "pending",
    createdAt: "2026-09-26T18:22:00",
    updatedAt: "2026-09-26T18:22:00",
  },
];

// Matches get_all_users(): newest account first
export const mockUsers = [...users].sort((a, b) =>
  b.createdAt.localeCompare(a.createdAt),
);

