import { defaultEventImage } from "./publicEvents";

// An organiser's own event from GET /users/me/events, in EventCard's shape: the
// latest version, not what the public sees as toEvent() gives
export function toOrganiserEvent(event, organiser) {
  return {
    eventId: event.eventId,
    name: event.name,
    description: event.description,
    startDatetime: event.startDatetime,
    endDatetime: event.endDatetime,
    image: event.imageUrl ?? defaultEventImage,
    externalLink: event.ticketUrl ?? "",
    categoryId: event.category.slug,
    category: event.category.name,
    // The area for filters; the venue is what people read
    locationId: event.location.area,
    location: event.location.name,
    address: event.location.address,
    // The venue as the form's search box holds it
    venue: {
      placeId: event.location.placeId,
      name: event.location.name,
      address: event.location.address,
      area: event.location.area,
    },
    status: event.status,
    rejectionReason: event.rejectionReason,
    // The server's answers, so Delete or Cancel and the edit banners agree with it
    hasBeenPublic: event.hasBeenPublic,
    editPending: event.editPending,
    organiserId: organiser.userId,
    organiser: organiser.username,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    orgUpdatedAt: event.organiserUpdatedAt,
    adminUpdatedAt: event.adminUpdatedAt,
    // Organisers check events rather than save them
    listed: false,
  };
}

// "2026-11-14T19:30" as a Manchester clock shows the moment: what the form's
// datetime-local input holds and the API reads
const londonParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// A moment as the form's datetime-local input holds it, on a Manchester clock
export function toLondonInput(value) {
  if (!value) return "";
  const parts = Object.fromEntries(
    londonParts.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
