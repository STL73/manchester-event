import { CalendarClock, CalendarPlus, History } from "lucide-react";

// The page's one action: making an event is the organiser's main job,
// so it stays on the page (navigation lives in the sidebar)
export const myDraftsActions = [
  { label: "Create event", to: "/dashboard/create-events", icon: CalendarPlus },
];

// The same name as the sidebar link
export const myDraftsTitle = "My Drafts";

// The line under the title: "3 drafts · last edited 27 Sept"
export const myDraftsSummary = {
  one: "draft",
  many: "drafts",
  lastEdited: "last edited",
  none: "No drafts",
};

// The extra line on each card, under the event's own date
export const lastEditedNote = { icon: History, text: "Last edited" };

// Shown in place of Submit when the event's date has gone: an admin is
// never asked to approve an event that is already over
export const datePassedNotice = {
  icon: CalendarClock,
  text: "The date has passed. Edit it to submit.",
};

// Messages from my_drafts_view.inc.php, plus the new draft delete
export const myDraftsMessages = {
  noDrafts: "No draft events found.",
  draftDeleted: "Draft deleted successfully!",
  // After Submit: where the event has gone
  submitted: { text: "Sent for approval. You'll find it on", link: "My Events", to: "/dashboard/my-events?status=pending" },
};
