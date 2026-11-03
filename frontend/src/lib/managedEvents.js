import { toOrganiserEvent } from "./organiserEvents";

// The admin's events from the API (GET /events/manage), in the shape Manage
// Events, Admin Home and Event details read: the organiser's latest version,
// as toOrganiserEvent() makes it, plus who decided last and, for an edit of a
// live event, the approved version in the same shape, so "what changed"
// compares like with like
export function toManagedEvent(event) {
  const snapshot = event.approvedSnapshot;
  return {
    ...toOrganiserEvent(event, event.organiser),
    adminId: event.adminId,
    adminName: event.adminName,
    adminUpdatedAt: event.adminUpdatedAt,
    // A venue or category since removed reads as the current one
    approvedSnapshot:
      snapshot &&
      toOrganiserEvent(
        { ...event, ...snapshot, category: snapshot.category ?? event.category, location: snapshot.location ?? event.location },
        event.organiser,
      ),
  };
}
