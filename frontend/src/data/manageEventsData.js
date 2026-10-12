import { Check, ClipboardList, Eye, GitCompare, X } from "lucide-react";

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

// From manage_events_view
export const manageEventsMessages = {
  noEvents: "No events found.",
};

// Manage Events (decided 2026-10-12, layout A): the events as a list that
// opens on the review queue, each opening in a side panel with the whole
// event and, while pending, Approve or Reject (a reason is required)
export const manageEventsPage = {
  title: "Manage Events",
  icon: ClipboardList,
  summary: {
    waiting: "waiting for review",
    edits: (count) => `${count} ${count === 1 ? "is an edit" : "are edits"} of a live event`,
    total: (count) => `${count} events`,
    none: "Nothing waiting for review",
  },
  searchPlaceholder: "Search events or organisers…",
  pageSize: 15,
  paging: (from, to, total) => `Showing ${from}–${to} of ${total} events`,
  review: "Review",
  open: "Open",
  editOfLive: "Edit of a live event",
  context: {
    pending: (days) => (days === 0 ? "Submitted today" : `Submitted ${days === 1 ? "1 day" : `${days} days`} ago`),
    pendingEdit: (days) => (days === 0 ? "Edit sent today" : `Edit sent ${days === 1 ? "1 day" : `${days} days`} ago`),
    approved: (date, admin) => `Approved ${date}${admin ? ` by ${admin}` : ""}`,
    rejected: (date, admin) => `Rejected ${date}${admin ? ` by ${admin}` : ""}`,
    past: "Took place",
    cancelled: "Cancelled by the organiser",
  },
};

// The pills above the list; "Needs review" (pending) comes first and is
// where the page opens. Values are eventState()s
export const eventViews = {
  label: "Show events",
  options: [
    { value: "pending", label: "Needs review", attention: true },
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "past", label: "Past" },
    { value: "cancelled", label: "Cancelled" },
  ],
};

export const eventSortOptions = [
  { value: "waiting", label: "Oldest waiting first" },
  { value: "newest", label: "Newest first" },
  { value: "soonest", label: "Happening soonest" },
  { value: "az", label: "A-Z" },
];

// The side panel
export const eventPanel = {
  reviewTitle: "Review event",
  title: "Event",
  changes: {
    title: "What changed since it was approved",
    icon: GitCompare,
    note: "The approved version stays public until you decide.",
    updated: "updated",
    fields: {
      name: "Name",
      description: "Description",
      startDatetime: "Starts",
      endDatetime: "Ends",
      category: "Category",
      location: "Area",
      address: "Address",
      externalLink: "Ticket link",
      image: "Photo",
    },
  },
  organiserStats: (total, rejected) =>
    `Organiser · ${total} ${total === 1 ? "event" : "events"}${rejected ? `, ${rejected} rejected` : ""}`,
  ticketLink: "Ticket link",
  decisionLabel: "Your decision",
  approve: { label: "Approve", submit: "Approve and publish", icon: Check },
  reject: { label: "Reject", submit: "Reject and tell the organiser", icon: X },
  approveNote: "It goes live on Explore straight away.",
  approveEditNote: "The changes replace the live version straight away.",
  reasonLabel: "Reason for the organiser",
  reasonHint: "required",
  reasonPlaceholder: "e.g. The ticket link doesn't work. Fix it and send it again.",
  reasonRequired: "Tell the organiser what to change.",
  liveNote: "To take it down, reject it with a reason; the organiser can fix it and send it again.",
  takeDown: { label: "Reject this event", icon: X },
  openPage: { label: "Open the event page", icon: Eye },
  rejectedReason: "Reason given",
};

// After a decision
export const manageEventsDecisions = {
  approved: "Approved. It's live on Explore.",
  rejected: "Rejected. The organiser can see your reason.",
};

// Mock of the logged-in admin, stored as admin_updated_by
export const currentAdmin = { id: 1, name: "adminName" };

// Matches get_all_events(): every status except drafts, newest first
export function getManagedEvents(events) {
  return events
    .filter((event) => event.status !== "draft")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
