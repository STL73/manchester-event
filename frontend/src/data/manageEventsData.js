import { ChevronLeft, ClipboardPen, Eye, Save, Users } from "lucide-react";

export const manageEventsActions = [
  { label: "Manage Users", to: "/dashboard/manage-users", icon: Users },
];

export const eventTableColumns = [
  "ID",
  "Name",
  "Organiser",
  "Status",
  "Admin Update",
  "Organiser Update",
  "Actions",
];

// Every event status; drafts are never listed on Manage Events,
// but the label and .status-draft colour are ready for My Drafts
export const eventStatuses = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "past", label: "Past" },
  { value: "draft", label: "Draft" },
];

// Matches the options in render_edit_event_form()
export const editableEventStatuses = ["pending", "approved", "rejected"];

export const eventActions = {
  view: { label: "View", tooltip: "View event", icon: Eye },
  edit: { label: "Edit Status", tooltip: "Edit event status", icon: ClipboardPen },
  pastLocked: { tooltip: "Past events cannot be edited" },
  goBack: { label: "Go Back", to: "/dashboard/manage-events", icon: ChevronLeft },
  updateStatus: { label: "Update Status", icon: Save },
};

// Messages from manage_events_view and edit_status_events PHP files
export const manageEventsMessages = {
  noEvents: "No events found.",
  eventNotFound: "Event not found.",
  statusUpdated: "Event status updated successfully.",
  pastNotEditable: "Editing past events is not allowed.",
  cancelledNotEditable: "Editing cancelled events is not allowed.",
};

// Mock of the logged-in admin, stored as admin_updated_by
export const currentAdmin = { id: 1, name: "adminName" };

// Matches get_all_events(): every status except drafts, newest first
export function getManagedEvents(events) {
  return events
    .filter((event) => event.status !== "draft")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
