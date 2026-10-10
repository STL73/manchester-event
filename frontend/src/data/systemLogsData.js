import { Logs } from "lucide-react";

export const systemLogsSection = { title: "System Logs", icon: Logs };

export const logTableColumns = ["Date/Time", "User", "User ID", "Action", "Details"];

export const systemLogsMessages = { noLogs: "No system logs yet." };

// Matches get_system_logs(): newest first, limit 100
export const systemLogsLimit = 100;

// Mock of the system_logs table. Actions use the names from the PHP
// log_system_action() calls; users match the Manage Users mock
// (1 adminName, 3 organiserName, 7 userName, 9 mcrgigs, 14 samk,
// 18 salfordarts, 21 a since-deleted user, 23 janedoe).
const logs = [
  { logId: 1, userId: 1, username: "adminName", action: "Event Status Changed", details: "Event ID: 2, New Status: approved", createdAt: "2026-09-27T10:42:00" },
  { logId: 2, userId: 1, username: "adminName", action: "User Login", details: "User logged in.", createdAt: "2026-09-27T10:38:00" },
  { logId: 3, userId: 3, username: "organiserName", action: "Event Created", details: "Event ID: 9, Name: Ancoats Street Food Social, Status: draft", createdAt: "2026-09-27T09:20:00" },
  { logId: 4, userId: 7, username: "userName", action: "Favourite Added", details: "Event ID: 6", createdAt: "2026-09-26T21:05:00" },
  { logId: 5, userId: 3, username: "organiserName", action: "Event Created", details: "Event ID: 6, Name: People of Manchester, Status: pending", createdAt: "2026-09-26T20:10:00" },
  { logId: 6, userId: 23, username: "janedoe", action: "User Registered", details: "Email: jane@email.com, Role: user", createdAt: "2026-09-26T18:22:00" },
  { logId: 7, userId: 1, username: "adminName", action: "User Status Changed", details: "User ID: 14, New Status: active", createdAt: "2026-09-26T16:05:00" },
  { logId: 8, userId: 9, username: "mcrgigs", action: "User Login Failed", details: "Incorrect password.", createdAt: "2026-09-26T08:47:00" },
  { logId: 9, userId: 1, username: "adminName", action: "Event Status Changed", details: "Event ID: 7, New Status: rejected", createdAt: "2026-09-25T09:30:00" },
  { logId: 10, userId: 3, username: "organiserName", action: "Draft Submitted", details: "Event ID: 2", createdAt: "2026-09-23T14:32:00" },
  { logId: 11, userId: 18, username: "salfordarts", action: "User Registered", details: "Email: events@salfordarts.org, Role: organiser", createdAt: "2026-09-22T08:40:00" },
  { logId: 12, userId: 7, username: "userName", action: "Preferences Updated", details: "Categories: music,community", createdAt: "2026-09-21T19:15:00" },
  { logId: 13, userId: 1, username: "adminName", action: "Event Status Changed", details: "Event ID: 5, New Status: cancelled", createdAt: "2026-09-20T09:00:00" },
  { logId: 14, userId: 3, username: "organiserName", action: "Event Updated", details: "Event ID: 5, Name: Manchester Active Weekend", createdAt: "2026-09-18T12:00:00" },
  { logId: 15, userId: 1, username: "adminName", action: "User Deleted", details: "Deleted User ID: 21", createdAt: "2026-09-18T11:47:00" },
  { logId: 16, userId: 7, username: "userName", action: "Password Changed", details: "User changed password.", createdAt: "2026-09-15T21:12:00" },
  { logId: 17, userId: 14, username: "samk", action: "Avatar Updated", details: "New avatar path: uploads/avatar/user_14.jpg", createdAt: "2026-09-14T17:30:00" },
  { logId: 18, userId: 1, username: "adminName", action: "User Status Changed", details: "User ID: 9, New Status: suspended", createdAt: "2026-09-12T14:20:00" },
  { logId: 19, userId: 7, username: "userName", action: "Favourite Removed", details: "Event ID: 2", createdAt: "2026-09-10T20:02:00" },
  { logId: 20, userId: 9, username: "mcrgigs", action: "Event Deleted", details: "Event ID: 11", createdAt: "2026-09-05T13:25:00" },
  { logId: 21, userId: 7, username: "userName", action: "User Logout", details: "User logged out.", createdAt: "2026-09-01T22:40:00" },
];

export const systemLogs = [...logs]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, systemLogsLimit);
