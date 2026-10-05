import { CalendarPlus, CalendarX, ChevronLeft, Pencil, Save } from "lucide-react";

export const createEventForm = {
  heading: "Create Your Event",
  headingIcon: CalendarPlus,
  title: "Event Details",
  requiredNote: "All fields with * are required.",
  imagePreviewLabel: "Image Preview:",
  saveDraft: { label: "Save as Draft", icon: Save },
};

// Edit mode of the same page (edit_event.php)
export const editEventForm = {
  heading: "Edit Event",
  headingIcon: Pencil,
  imagePreviewLabel: "Current Image:",
  update: { label: "Update Event", icon: Save },
  cancelEvent: { label: "Cancel Event", icon: CalendarX },
  goBack: { label: "Go Back", icon: ChevronLeft },
  // Used when the page was opened directly and there is nothing to go back to
  goBackFallback: "/dashboard/my-events",
};

// Fields from create_events.php, split into its two columns.
// Ticket Link is marked required because validate_event_input() requires it.
export const eventFieldColumns = [
  [
    { id: "eventName", label: "Event Name", type: "text", placeholder: "Enter event name", required: true },
    { id: "startDatetime", label: "Start Date and Time", type: "datetime-local", required: true },
    { id: "endDatetime", label: "End Date and Time", type: "datetime-local" },
    { id: "description", label: "Event Description", type: "textarea", placeholder: "Enter event description", required: true },
  ],
  [
    { id: "categoryId", label: "Category", type: "select", placeholder: "-- Select a category --", required: true },
    { id: "locationName", label: "Location Name", type: "text", placeholder: "Enter location name", required: true },
    { id: "address", label: "Address", type: "text", placeholder: "Enter the full address", required: true },
    { id: "externalLink", label: "Ticket Link", type: "url", placeholder: "https://", required: true },
    { id: "image", label: "Event Image", type: "file" },
  ],
];

// Matches handle_event_image(): JPG, PNG or GIF up to 5MB
export const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
export const maxImageSize = 5 * 1024 * 1024;

// Messages from validate_event_input(), handle_event_image() and create_event_view
export const createEventMessages = {
  eventName: "Event name is required.",
  description: "Event description is required.",
  startDatetime: "Start date and time is required.",
  categoryId: "Please select a category.",
  locationName: "Location name is required.",
  address: "Address is required.",
  externalLink: "External link is required.",
  invalidUrl: "Please enter a valid URL.",
  invalidImage: "Invalid image format. Only JPG, PNG, and GIF are allowed.",
  imageTooLarge: "Image exceeds maximum allowed size (5MB).",
  created: "Event created successfully!",
  // edit_event.inc.php and edit_event_view.inc.php
  updated: "Event updated successfully!",
  updatedForApproval:
    "Event updated successfully! It has been sent to the admin for approval again.",
  submitted: "Draft submitted for approval!",
  confirmCancel: "Are you sure you want to cancel this event?",
  cancelled: "Event cancelled successfully!",
  notFound: "Event not found.",
  pastLocked: "Past events cannot be edited.",
  cancelledLocked: "Cancelled events cannot be edited.",
};
