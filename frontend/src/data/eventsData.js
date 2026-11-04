import {
  CalendarX2,
  ChevronLeft,
  CircleX,
  Clock,
  ExternalLink,
  Eye,
  History,
  Info,
  SquarePen,
  Ticket,
} from "lucide-react";
import { isUpcoming } from "../lib/eventDates";

// Dashboard pages open event details inside the dashboard;
// the public Events page opens them full screen
export function eventDetailsPath(eventId, inDashboard) {
  return inDashboard ? `/dashboard/events/${eventId}` : `/events/${eventId}`;
}

export const eventDetailsPage = {
  dashboardTitle: "Event Details",
  titleIcon: Eye,
  notFound: "Event not found.",
  loadError: "This event couldn't be loaded. Check your connection and try again.",
  goBack: { label: "Go Back", icon: ChevronLeft },
  // Used when the page was opened directly and there is nothing to go back to
  goBackFallback: "/dashboard/home",
  // The public page's way back
  allEvents: { label: "All events", icon: ChevronLeft, to: "/events" },
  // Before the admin's rejection_reason on a rejected event
  rejectionReason: "The admin said:",
  about: { title: "About this event", icon: Info },
  organiserLabel: "Organiser",
  maps: { label: "Open in Google Maps", icon: ExternalLink },
  tickets: { label: "Tickets and info", icon: Ticket, linkIcon: ExternalLink },
  // Organisers and admins check the link rather than follow it
  ticketLink: { label: "Ticket link", icon: Ticket },
  saved: "Saved",
  save: "Save",
  logInToSave: { link: "Log in", text: "to save it to your favourites", to: "/auth/login" },
  // One banner at most, by what the event is now. `viewer` lines differ by role
  banners: {
    cancelled: {
      icon: CalendarX2,
      title: "This event has been cancelled",
      text: "It won't go ahead.",
      user: "It won't go ahead. It stays in your favourites until you remove it.",
    },
    past: { icon: History, title: "This event has ended", text: "It took place on" },
    pending: {
      icon: Clock,
      title: "Waiting for approval",
      text: "An admin will review it. It isn't public yet.",
      admin: "It isn't public until you approve it.",
    },
    rejected: {
      icon: CircleX,
      title: "Rejected",
      text: "An admin rejected this event. Edit it from My Events and submit it again.",
      admin: "You rejected this event. The organiser can edit it and submit it again.",
    },
    draft: { icon: SquarePen, title: "Draft", text: "Only you can see it until you submit it from My Drafts." },
    // An edit of a live event: the approved version is still what people see
    pendingEdit: {
      icon: Clock,
      title: "Your changes are waiting for approval",
      text: "The earlier version stays live until an admin approves them.",
      admin: "The earlier version stays live until you approve the changes.",
    },
    rejectedEdit: {
      icon: CircleX,
      title: "Changes rejected",
      text: "The earlier version is still live. Edit it from My Events to send new changes.",
      admin: "You rejected these changes. The earlier version is still live.",
    },
  },
};

// What an event is now. Past is worked out from the dates, as the database
// will (the mock data also stores "past"), so an approved event whose time
// has gone reads as past everywhere
export function eventState(event, now) {
  if (event.status === "approved" && !isUpcoming(event, now)) return "past";
  return event.status;
}

// Once public, an event can only be cancelled, never deleted. An organiser's
// events from the API carry the server's answer; the mock ones work it out
export function hasBeenPublic(event) {
  if (typeof event.hasBeenPublic === "boolean") return event.hasBeenPublic;
  return Boolean(event.approvedSnapshot) || ["approved", "past", "cancelled"].includes(event.status);
}

// The categories table from the PHP project's insert data, in the same order
export const eventCategories = [
  { id: "music", name: "Music", description: "Live concerts, open mics, gigs, DJ sets and music festivals" },
  { id: "theatre-performance", name: "Theatre & Performance", description: "Plays, stand-up comedy, and live shows" },
  { id: "art-exhibitions", name: "Art & Exhibitions", description: "Gallery openings, artist talks, installations" },
  { id: "film-screenings", name: "Film & Screenings", description: "Film festivals, independent cinema, outdoor screenings" },
  { id: "food-drink", name: "Food & Drink", description: "Tastings, food and drink festivals, and food markets" },
  { id: "workshops-classes", name: "Workshops & Classes", description: "Skill-building workshops and classes" },
  { id: "tech-innovation", name: "Tech & Innovation", description: "Hackathons, product launches, and meetups" },
  { id: "community-culture", name: "Community & Culture", description: "Local gatherings and cultural celebrations" },
  { id: "health-wellness", name: "Health & Wellness", description: "Fitness, mindfulness, and wellbeing events" },
  { id: "markets-fairs", name: "Markets & Fairs", description: "Craft fairs, vintage sales, and makers markets" },
  { id: "literature-talks", name: "Literature & Talks", description: "Readings, book launches, and panel discussions" },
  { id: "festivals", name: "Festivals", description: "Large-scale festivals across any theme" },
  { id: "charity-causes", name: "Charity & Causes", description: "Fundraisers and community impact events" },
  { id: "nightlife", name: "Nightlife", description: "Nightclubs, bars, and late-night events" },
  { id: "family-kids", name: "Family & Kids", description: "Events suitable for children and families" },
  { id: "student-life", name: "Student Life", description: "University and student-led events" },
  { id: "lgbtq", name: "LGBTQ+", description: "Inclusive and queer-centred events" },
  { id: "history-heritage", name: "History & Heritage", description: "Tours and events focused on local history" },
  {
    id: "sports",
    name: "Sports",
    description: "Athletic competitions, games, matches, tournaments, training sessions, and sports meetups",
  },
];

export const eventLocations = [
  { id: "city-centre", name: "Manchester City Centre" },
  { id: "northern-quarter", name: "Northern Quarter" },
  { id: "mediacity", name: "MediaCityUK" },
  { id: "salford", name: "Salford" },
  { id: "heaton-park", name: "Heaton Park" },
];

// Public pages only show approved events, like get_all_public_events()
export function isPublicEvent(event) {
  return event.status === "approved";
}
