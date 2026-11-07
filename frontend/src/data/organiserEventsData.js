import { CalendarArrowUp, CalendarPlus, Pencil, Trash2 } from "lucide-react";

// Buttons shared by the organiser dashboard, My Events and My Drafts
export const organiserEventActions = {
  edit: { label: "Edit", icon: Pencil },
  delete: { label: "Delete", icon: Trash2 },
  // The card asks before deleting, in place of the PHP confirm() pop-up
  confirmDelete: { question: "Delete this event?", cancel: "Keep it", confirm: "Delete permanently" },
  submitDraft: { label: "Submit for approval", icon: CalendarArrowUp },
  createFirst: {
    label: "Create First Event",
    to: "/dashboard/create-events",
    icon: CalendarPlus,
  },
};

// Messages from delete_event and submit_draft PHP files
export const organiserEventMessages = {
  noEvents: "You haven't created any events yet.",
  eventDeleted: "Event deleted successfully!",
};

// Which buttons an organiser's event card shows, by eventState(). An event
// can be deleted only before it has ever been public (a pending edit of a
// live event has been); once live it can be edited (cancelling is on the
// edit page); past and cancelled are view only. hasBeenPublic is the server's
export function organiserCardActions(state, event) {
  return {
    canEdit: ["draft", "pending", "rejected", "approved"].includes(state),
    canDelete: ["draft", "pending", "rejected"].includes(state) && !event?.hasBeenPublic,
  };
}

// Future route for edit_event.php
export function editEventPath(eventId) {
  return `/dashboard/my-events/${eventId}/edit`;
}
