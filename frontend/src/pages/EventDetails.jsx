import { CalendarArrowDown, CalendarDays, Heart, MapPin, Tag, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import { canViewEvent, eventDetailsPage, eventDetailsPath, eventState } from "../data/eventsData";
import { addToCalendar } from "../data/myFavouritesData";
import { organiserStatusLabels } from "../data/organiserEventsData";
import { downloadEventIcs } from "../lib/calendar";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const endDayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// "19:30 – 23:00", or the end's day too when it finishes on another one
function timeRange(event) {
  const start = new Date(event.startDatetime);
  if (!event.endDatetime) return timeFormatter.format(start);
  const end = new Date(event.endDatetime);
  const sameDay = start.toDateString() === end.toDateString();
  return `${timeFormatter.format(start)} – ${(sameDay ? timeFormatter : endDayFormatter).format(end)}`;
}

function mapsUrl(event) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address ?? event.location)}`;
}

function StateBanner({ event, state, role }) {
  const banner = eventDetailsPage.banners[state];
  if (!banner) return null;
  const text =
    state === "past"
      ? `${banner.text} ${dayFormatter.format(new Date(event.startDatetime))}.`
      : (banner[role] ?? banner.text);

  return (
    <div className={`event-details-banner is-${state}`} role="status">
      <banner.icon aria-hidden="true" />
      <p>
        <strong>{banner.title}</strong>
        {text}
      </p>
    </div>
  );
}

// The buttons under the facts. Users and guests get them while the event is
// still to come; organisers and admins check the event rather than attend
// it, so they get the ticket link as a fact instead
function PanelActions({ event, state, role, isFavourite, onToggleFavourite }) {
  const { tickets, saved, save, logInToSave } = eventDetailsPage;
  const isAttendee = role === "user" || role === "guest";
  const upcoming = state === "approved";

  // An ended or cancelled favourite keeps its heart, so it can be removed
  if (role === "user" && !upcoming) {
    return isFavourite ? (
      <div className="event-details-actions">
        <Button type="button" variant="secondary" size="md" onClick={() => onToggleFavourite(event.eventId)}>
          <Heart className="event-details-heart is-saved" aria-hidden="true" />
          {saved}
        </Button>
      </div>
    ) : null;
  }
  if (!isAttendee || !upcoming) return null;

  function addEventToCalendar() {
    downloadEventIcs(event, `${window.location.origin}${eventDetailsPath(event.eventId, false)}`);
  }

  return (
    <div className="event-details-actions">
      {event.externalLink && (
        <Button href={event.externalLink} variant="primary" size="md" target="_blank" rel="noreferrer">
          <tickets.icon aria-hidden="true" />
          {tickets.label}
          <tickets.linkIcon aria-hidden="true" />
        </Button>
      )}
      <div className="event-details-actions-row">
        <Button type="button" variant="secondary" size="md" onClick={addEventToCalendar}>
          <CalendarArrowDown aria-hidden="true" />
          {addToCalendar.label}
        </Button>
        {role === "user" && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            aria-pressed={isFavourite}
            onClick={() => onToggleFavourite(event.eventId)}
          >
            <Heart className={`event-details-heart ${isFavourite ? "is-saved" : ""}`} aria-hidden="true" />
            {isFavourite ? saved : save}
          </Button>
        )}
      </div>
      {role === "guest" && (
        <p className="event-details-login">
          <Link to={logInToSave.to}>{logInToSave.link}</Link> {logInToSave.text}
        </p>
      )}
    </div>
  );
}

// Photo, then the title and description beside a panel with when, where,
// who and the actions (layout A, decided 2026-10-12). Below 52rem the panel
// moves up under the title, so the facts come before the description
function EventDetailsBody({ event, TitleTag, titleId, role, favouriteIds, onToggleFavourite }) {
  const { about, organiserLabel, maps, ticketLink } = eventDetailsPage;
  const state = eventState(event, new Date());
  const isStaff = role === "organiser" || role === "admin";
  const isFavourite = favouriteIds.includes(event.eventId);
  const isOver = state === "past" || state === "cancelled";
  // One level under the event's name, whichever level that is on the page
  const AboutTag = TitleTag === "h1" ? "h2" : "h3";

  return (
    <div className={`event-details ${isOver ? "is-over" : ""} ${state === "cancelled" ? "is-cancelled" : ""}`}>
      <StateBanner event={event} state={state} role={role} />

      <div className="event-details-image-container">
        <img
          className="event-details-image"
          src={event.image}
          alt=""
          style={{ objectPosition: event.imagePosition }}
        />
      </div>

      <div className="event-details-layout">
        <div className="event-details-head">
          <div className="event-details-chips">
            <p className="event-card-category">
              <Tag className="event-card-icon" aria-hidden="true" />
              {event.category}
            </p>
            {isStaff && (
              <span className={`status-badge status-${state}`}>
                {(role === "organiser" && organiserStatusLabels[state]) || state}
              </span>
            )}
          </div>
          <TitleTag className="event-details-title" id={titleId}>
            {event.name}
          </TitleTag>
        </div>

        <aside className="event-details-panel" aria-label="When and where">
          <ul className="event-details-facts">
            <li className="event-details-fact">
              <CalendarDays aria-hidden="true" />
              <p>
                <strong>{dayFormatter.format(new Date(event.startDatetime))}</strong>
                {timeRange(event)}
              </p>
            </li>
            <li className="event-details-fact">
              <MapPin aria-hidden="true" />
              <p>
                <strong>{event.location}</strong>
                {event.address}
                <a className="event-details-fact-link" href={mapsUrl(event)} target="_blank" rel="noreferrer">
                  {maps.label}
                  <maps.icon aria-hidden="true" />
                </a>
              </p>
            </li>
            <li className="event-details-fact">
              <UserRound aria-hidden="true" />
              <p>
                <strong>{event.organiser}</strong>
                {organiserLabel}
              </p>
            </li>
            {isStaff && event.externalLink && (
              <li className="event-details-fact">
                <ticketLink.icon aria-hidden="true" />
                <p>
                  <strong>{ticketLink.label}</strong>
                  <a className="event-details-fact-link" href={event.externalLink} target="_blank" rel="noreferrer">
                    {event.externalLink.replace(/^https?:\/\//, "")}
                    <maps.icon aria-hidden="true" />
                  </a>
                </p>
              </li>
            )}
          </ul>
          <PanelActions
            event={event}
            state={state}
            role={role}
            isFavourite={isFavourite}
            onToggleFavourite={onToggleFavourite}
          />
        </aside>

        {event.description && (
          <section className="event-details-about" aria-labelledby={`${titleId}-about`}>
            <AboutTag className="dashboard-title event-details-about-title" id={`${titleId}-about`}>
              <about.icon className="dashboard-title-icon" aria-hidden="true" />
              {about.title}
            </AboutTag>
            <p className="event-details-description">{event.description}</p>
          </section>
        )}
      </div>
    </div>
  );
}

// `events` is the master list; canViewEvent decides what this viewer may
// open, so a typed-in id of someone's draft reads as not found. `role` is
// "guest" when signed out
export default function EventDetails({
  events,
  inDashboard = false,
  role = "guest",
  organiserId,
  favouriteIds = [],
  onToggleFavourite,
}) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const found = events.find((item) => String(item.eventId) === eventId);
  const event = found && canViewEvent(found, role, organiserId) ? found : null;
  const { dashboardTitle, titleIcon: TitleIcon, goBack, allEvents } = eventDetailsPage;
  const bodyProps = { role, favouriteIds, onToggleFavourite };

  function handleGoBack() {
    // "default" means this is the first page in the tab's history
    if (location.key === "default") navigate(eventDetailsPage.goBackFallback);
    else navigate(-1);
  }

  // Inside the dashboard: same layout as the edit pages, with Go Back
  if (inDashboard) {
    return (
      <div className="dashboard-home">
        <section
          className="dashboard-section"
          aria-labelledby="event-details-heading"
        >
          <DashboardPageHeading
            id="event-details-heading"
            icon={TitleIcon}
            title={dashboardTitle}
          >
            <Button type="button" variant="primary" size="sm" onClick={handleGoBack}>
              <goBack.icon aria-hidden="true" />
              {goBack.label}
            </Button>
          </DashboardPageHeading>

          {event ? (
            <EventDetailsBody event={event} TitleTag="h2" titleId="event-details-title" {...bodyProps} />
          ) : (
            <EmptyState icon={TitleIcon} text={eventDetailsPage.notFound} />
          )}
        </section>
      </div>
    );
  }

  if (!event) {
    return (
      <section className="section-content">
        <h1 className="section-title">Event not found</h1>
        <Button to="/events" variant="primary" size="md">
          Back to Events
        </Button>
      </section>
    );
  }

  // No <main> of its own: App already wraps every page in one. The event's
  // name is the public page's <h1>
  return (
    <section
      className="section-content event-details-page"
      aria-labelledby="event-details-title"
    >
      <div className="event-details-back">
        <Button to={allEvents.to} variant="secondary" size="sm">
          <allEvents.icon aria-hidden="true" />
          {allEvents.label}
        </Button>
      </div>
      <EventDetailsBody event={event} TitleTag="h1" titleId="event-details-title" {...bodyProps} />
    </section>
  );
}
