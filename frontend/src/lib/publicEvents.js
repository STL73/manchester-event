// Events from the API (GET /events, /events/:id) in the shape the pages and
// EventCard already read, so they work the same with the mock events the
// organiser and admin pages still use until Phases 5 and 7

export const defaultEventImage = "/images/events/placeholder.jpg";

export function toEvent(event) {
  return {
    eventId: event.eventId,
    name: event.name,
    description: event.description,
    startDatetime: event.startDatetime,
    endDatetime: event.endDatetime,
    // image_url NULL = the default picture
    image: event.imageUrl ?? defaultEventImage,
    externalLink: event.ticketUrl,
    categoryId: event.category.slug,
    category: event.category.name,
    // The area for filters and links; the venue's own name is what people read
    locationId: event.location.area,
    location: event.location.name,
    address: event.location.address,
    status: event.status,
    organiserId: event.organiser.userId,
    organiser: event.organiser.username,
    // Whether the lists show it, which is when it can be saved. Lists only
    // hold listed events, so only details and favourites send it
    listed: event.listed ?? true,
  };
}

// "/events?when=week&limit=3", leaving out filters that aren't in use
export function eventsPath(query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    const text = Array.isArray(value) ? value.join(",") : String(value ?? "").trim();
    if (text) params.set(key, text);
  });
  const search = params.toString();
  return search ? `/events?${search}` : "/events";
}
