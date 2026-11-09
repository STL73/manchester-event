import { toOrganiserEvent } from "./organiserEvents";

// An admin's event from GET /events/manage, in toOrganiserEvent()'s shape, with
// who decided last and a waiting edit's approved version in the same shape
export function toManagedEvent(event) {
  const snapshot = event.approvedSnapshot;
  return {
    ...toOrganiserEvent(event, event.organiser),
    adminId: event.adminId,
    adminName: event.adminName,
    // A venue or category since removed reads as the current one
    approvedSnapshot:
      snapshot &&
      toOrganiserEvent(
        { ...event, ...snapshot, category: snapshot.category ?? event.category, location: snapshot.location ?? event.location },
        event.organiser,
      ),
  };
}
