// What an event's or account's status is now, and the word each role reads for it
import { isUpcoming } from "./eventDates";
import { eventStatuses } from "../data/manageEventsData";
import { accountStatuses } from "../data/manageUsersData";

const labels = Object.fromEntries(
  [...eventStatuses, ...accountStatuses].map(({ value, label }) => [value, label]),
);

// An approved event whose time has gone reads as past: the database never stores "past"
export function eventState(event, now) {
  if (event.status === "approved" && !isUpcoming(event, now)) return "past";
  return event.status;
}

// Public pages show approved events
export function isPublicEvent(event) {
  return event.status === "approved";
}

// "Pending", "Suspended"… Organisers read "approved" as "Live", which says the
// event is public; admins keep "Approved", the word they approve with
export function statusLabel(status, role) {
  if (role === "organiser" && status === "approved") return "Live";
  return labels[status] ?? status;
}
