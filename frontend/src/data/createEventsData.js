import {
  CalendarArrowUp,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  ChevronLeft,
  CircleX,
  Clock,
  ImageUp,
  MapPin,
  Pencil,
  Radio,
  RefreshCw,
  Save,
  Send,
  SquarePen,
  Ticket,
  Trash2,
  Type,
  X,
} from "lucide-react";

// Create Event (create_events.php) and Edit Event (edit_event.php): one form
// in five groups, the live card beside it (layout A, decided 2026-10-12)
export const createEventForm = {
  heading: "Create Event",
  headingIcon: CalendarPlus,
  summary: "Saved as a draft until you submit it",
  previewLabel: "How it will look on Explore",
  saveDraft: { label: "Save draft", icon: Save },
  submit: { label: "Submit for approval", icon: CalendarArrowUp },
  draftNote: "Drafts are only visible to you.",
};

export const editEventForm = {
  heading: "Edit Event",
  headingIcon: Pencil,
  // Anything that isn't a draft goes back to an admin when saved
  resubmit: { label: "Save and send for approval", icon: Send },
  resubmitNote: "It goes back to pending until an admin approves it.",
  goBack: { label: "Go Back", icon: ChevronLeft },
  // Used when the page was opened directly and there is nothing to go back to
  goBackFallback: "/dashboard/my-events",
  summary: {
    draft: "Draft",
    approved: "Live",
    pending: "Waiting for approval",
    rejected: "Rejected",
    lastEdited: "last edited",
  },
};

// The groups and their fields, in the order people think about an event.
// Every field is required but the end time, which says "Optional"
export const eventFormGroups = [
  {
    id: "basics",
    title: "The basics",
    icon: Type,
    fields: [
      { id: "eventName", label: "Event name", type: "text", placeholder: "e.g. Manchester Live Sessions", maxLength: 100 },
      { id: "categoryId", label: "Category", type: "category", placeholder: "Choose a category" },
      {
        id: "description",
        label: "Description",
        type: "textarea",
        placeholder: "What happens, who it's for, anything to bring",
        maxLength: 2000,
        hint: "Line breaks are kept",
      },
    ],
  },
  {
    id: "when",
    title: "When",
    icon: CalendarDays,
    row: true,
    fields: [
      { id: "startDatetime", label: "Starts", type: "datetime-local" },
      { id: "endDatetime", label: "Ends", type: "datetime-local", optional: true },
    ],
  },
  {
    id: "where",
    title: "Where",
    icon: MapPin,
    row: true,
    fields: [
      // An area from the list: it is what Explore's location filter uses
      { id: "locationId", label: "Area", type: "area", placeholder: "Choose an area" },
      { id: "address", label: "Venue and address", type: "text", placeholder: "Venue, street, postcode" },
    ],
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: Ticket,
    fields: [{ id: "externalLink", label: "Ticket or info link", type: "url", placeholder: "https://" }],
  },
  {
    id: "photo",
    title: "Photo",
    icon: ImageUp,
    fields: [{ id: "image", label: "Photo", type: "image", optional: true }],
  },
];

// The photo box
export const imageDrop = {
  icon: ImageUp,
  title: "Drop a photo here, or click to choose",
  types: "JPG, PNG, WebP or GIF, up to 5 MB",
  replace: { label: "Replace", icon: RefreshCw },
  remove: { label: "Remove", icon: X },
};

// handle_event_image() allowed JPG, PNG and GIF; WebP is added, as on Settings
export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const maxImageSize = 5 * 1024 * 1024;

// "3 of 6 needed to submit": each line is done when its fields are filled
export const submitChecklist = {
  title: (done, total) => `${done} of ${total} needed to submit`,
  items: [
    { label: "Name", fields: ["eventName"] },
    { label: "Category", fields: ["categoryId"] },
    { label: "Description", fields: ["description"] },
    { label: "Start", fields: ["startDatetime"] },
    { label: "Area and address", fields: ["locationId", "address"] },
    { label: "Ticket link", fields: ["externalLink"] },
  ],
};

// One banner on Edit, by the event's status. A live event's edit waits for
// an admin while the approved version stays public (schema option b)
export const editBanners = {
  draft: { icon: SquarePen, title: "Draft", text: "Only you can see it. Save as you go; submit when it's ready." },
  approved: {
    icon: Radio,
    title: "This event is live",
    text: "Your changes go to an admin first. Until they're approved, people keep seeing the current version, and anyone who saved it keeps it in their favourites.",
  },
  pending: { icon: Clock, title: "Waiting for approval", text: "An admin hasn't looked at it yet. Saving keeps it in the queue with your changes." },
  pendingEdit: {
    icon: Clock,
    title: "Your changes are waiting for approval",
    text: "The earlier version stays live until an admin approves them.",
  },
  rejected: { icon: CircleX, title: "Rejected", text: "Make the changes needed and send it again." },
};

// The red box at the bottom of Edit. An event that has been public can only
// be cancelled; one that never was can be deleted
export const dangerZone = {
  cancel: {
    icon: CalendarX,
    title: "Cancel this event",
    text: "It stays on the site marked as cancelled, and people who saved it keep it greyed out. This can't be undone.",
    button: "Cancel event",
    question: "Cancel this event for good?",
    keep: "Keep it",
    confirm: "Yes, cancel it",
  },
  delete: {
    icon: Trash2,
    title: "Delete this event",
    text: "It has never been public, so it can be deleted for good.",
    button: "Delete event",
    question: "Delete this event for good?",
    keep: "Keep it",
    confirm: "Delete permanently",
  },
};

// Where each save leads
export const afterSave = {
  draftsPath: "/dashboard/my-drafts",
  pendingPath: "/dashboard/my-events?status=pending",
  eventsPath: "/dashboard/my-events",
};

// Messages from validate_event_input(), handle_event_image() and the views,
// plus the new date checks
export const createEventMessages = {
  eventName: "Give the event a name.",
  description: "Add a description.",
  startDatetime: "Choose when it starts.",
  categoryId: "Choose a category.",
  locationId: "Choose an area.",
  address: "Add the venue and address.",
  externalLink: "Add a ticket or info link.",
  invalidUrl: "Enter a full link, starting with https://",
  endBeforeStart: "The end has to be after the start.",
  startInPast: "The start has passed. Choose a future date to submit.",
  invalidImage: "Choose a JPG, PNG, WebP or GIF.",
  imageTooLarge: "That photo is over 5 MB.",
  draftSaved: "Draft saved.",
  createdDraft: "Draft saved. It's only visible to you until you submit it.",
  submitted: "Sent for approval. An admin will review it.",
  resubmitted: "Saved and sent for approval. An admin will review your changes.",
  cancelled: "Event cancelled.",
  deleted: "Event deleted.",
  notFound: "Event not found.",
  pastLocked: "Past events can't be edited.",
  cancelledLocked: "Cancelled events can't be edited.",
};
