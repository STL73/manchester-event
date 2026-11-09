import { CalendarArrowUp, CalendarPlus, Pencil, Trash2 } from "lucide-react";

// Buttons shared by the organiser dashboard, My Events and My Drafts
export const organiserEventActions = {
  edit: { label: "Edit", icon: Pencil },
  delete: { label: "Delete", icon: Trash2 },
  // The card asks before deleting
  confirmDelete: { question: "Delete this event?", cancel: "Keep it", confirm: "Delete permanently" },
  submitDraft: { label: "Submit for approval", icon: CalendarArrowUp },
  createFirst: {
    label: "Create First Event",
    to: "/dashboard/create-events",
    icon: CalendarPlus,
  },
};

// The cards' messages
export const organiserEventMessages = {
  noEvents: "You haven't created any events yet.",
  eventDeleted: "Event deleted successfully!",
};

// The buttons an organiser's card shows, by eventState(): Delete only before an
// event has been public (the server's hasBeenPublic), past and cancelled View only
export function organiserCardActions(state, event) {
  return {
    canEdit: ["draft", "pending", "rejected", "approved"].includes(state),
    canDelete: ["draft", "pending", "rejected"].includes(state) && !event?.hasBeenPublic,
  };
}

// Edit Event's address for an event
export function editEventPath(eventId) {
  return `/dashboard/my-events/${eventId}/edit`;
}
