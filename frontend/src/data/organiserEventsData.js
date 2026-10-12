import { CalendarArrowUp, CalendarPlus, Pencil, Trash2 } from "lucide-react";

// Buttons shared by the organiser dashboard, My Events and My Drafts
export const organiserEventActions = {
  edit: { label: "Edit", icon: Pencil },
  delete: { label: "Delete", icon: Trash2 },
  // The card asks before deleting, in place of the PHP confirm() pop-up
  confirmDelete: { question: "Delete this event?", cancel: "Keep it", confirm: "Delete permanently" },
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
  eventDeleted: "Event deleted successfully!",
  draftSubmitted: "Draft submitted for approval!",
};

// Which buttons an organiser's event card shows, by eventState(). An event
// can be deleted only before it has ever been public; once live it can be
// edited (cancelling is on the edit page); past and cancelled are view only
export function organiserCardActions(state) {
  return {
    canEdit: ["draft", "pending", "rejected", "approved"].includes(state),
    canDelete: ["draft", "pending", "rejected"].includes(state),
  };
}

// Organisers read "approved" as "live": it says the event is public. Admins
// keep the stored status, the word they approve with
export const organiserStatusLabels = { approved: "live" };

// Future route for edit_event.php
export function editEventPath(eventId) {
  return `/dashboard/my-events/${eventId}/edit`;
}

// Mock of the logged-in organiser (organiserName in the users mock).
// Their events are the master events list filtered by this id.
export const currentOrganiser = { id: 3, name: "organiserName" };
