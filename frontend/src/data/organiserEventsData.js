import { CalendarArrowUp, CalendarPlus, Pencil, Trash2 } from "lucide-react";

// Buttons shared by the organiser dashboard, My Events and My Drafts
export const organiserEventActions = {
  edit: { label: "Edit", icon: Pencil },
  delete: { label: "Delete", icon: Trash2 },
  submitDraft: { label: "Submit for Approval", icon: CalendarArrowUp },
  createFirst: {
    label: "Create First Event",
    to: "/dashboard/create-events",
    icon: CalendarPlus,
  },
};

// Messages from delete_event and submit_draft PHP files
export const organiserEventMessages = {
  noEvents: "You haven't created any events yet.",
  confirmDelete: "Are you sure you want to delete this event?",
  eventDeleted: "Event deleted successfully!",
  draftSubmitted: "Draft submitted for approval!",
};

// Future route for edit_event.php
export function editEventPath(eventId) {
  return `/dashboard/my-events/${eventId}/edit`;
}

// Mock of the logged-in organiser (organiserName in the users mock).
// Their events are the master events list filtered by this id.
export const currentOrganiser = { id: 3, name: "organiserName" };
