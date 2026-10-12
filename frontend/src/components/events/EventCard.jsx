import { useEffect, useRef, useState } from "react";
import { CalendarArrowDown, CalendarDays, Eye, Heart, MapPin, Tag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Button from "../UI/Button";
import Tooltip from "../UI/Tooltip";
import { eventDetailsPath } from "../../data/eventsData";
import { organiserEventActions } from "../../data/organiserEventsData";
import { addToCalendar } from "../../data/myFavouritesData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function EventCard({
  event,
  isFavourite = false,
  canFavourite = false,
  onToggleFavourite,
  status,
  // The badge text when it differs from the status (organisers see "live")
  statusLabel,
  editTo,
  onDelete,
  muted = false,
  onAddToCalendar,
  // My Drafts: an extra line under the date ({ icon, text }), the card's
  // main action ({ label, icon, onClick }) or a notice in its place
  note,
  primaryAction,
  notice,
  // Create/Edit Event's live card: the same look, nothing to click
  preview = false,
}) {
  const { edit, delete: remove, confirmDelete } = organiserEventActions;
  // True from a "like" click until the heart's pop animation ends
  const [isPopping, setIsPopping] = useState(false);
  // Delete asks first; focus moves to "Keep it" and back to Delete after
  const [isConfirming, setIsConfirming] = useState(false);
  const deleteRef = useRef(null);
  const keepRef = useRef(null);

  useEffect(() => {
    if (isConfirming) keepRef.current?.focus();
  }, [isConfirming]);

  function closeConfirm() {
    setIsConfirming(false);
    requestAnimationFrame(() => deleteRef.current?.focus());
  }
  // Cards on dashboard pages open the details inside the dashboard
  const { pathname } = useLocation();
  const inDashboard = pathname.startsWith("/dashboard");
  // Past events can be viewed but not edited or deleted, as in the PHP
  const isPast = status === "past";
  const detailsPath = eventDetailsPath(event.eventId, inDashboard);

  // The whole card opens the event: the title link is stretched over the
  // card (see .event-card-link), and the action buttons sit above it.
  // muted greys out an event that has finished or been cancelled
  return (
    <article className={`event-card ${muted ? "event-card-muted" : ""} ${preview ? "event-card-preview" : ""}`.trim()}>
      {/* alt="": the title link right below already names the event, so a
          screen reader would read it twice. Lazy, because Explore lists every
          upcoming event and most cards start below the screen */}
      <div className="event-card-media">
        <img
          className="event-card-image"
          src={event.image}
          alt=""
          loading={preview ? "eager" : "lazy"}
          style={{ objectPosition: event.imagePosition }}
        />
      </div>
      <div className="event-card-content">
        {status && (
          <span className={`status-badge status-${status} event-card-status`}>
            {statusLabel ?? status}
          </span>
        )}
        <p className="event-card-category">
          <Tag className="event-card-icon" aria-hidden="true" />
          {event.category}
        </p>
        <h2 className="event-card-title">
          {preview ? (
            event.name
          ) : (
            <Link to={detailsPath} state={{ from: pathname }} className="event-card-link">
              {event.name}
            </Link>
          )}
        </h2>
        <p className="event-card-detail">
          <MapPin className="event-card-icon" aria-hidden="true" />
          {event.location}
        </p>
        {event.startDatetime && (
          <p className="event-card-detail">
            <CalendarDays className="event-card-icon" aria-hidden="true" />
            {dateFormatter.format(new Date(event.startDatetime))}
          </p>
        )}
        {note && (
          <p className="event-card-detail">
            <note.icon className="event-card-icon" aria-hidden="true" />
            {note.text}
          </p>
        )}
        {/* The card's main job, labelled and full width (My Drafts' Submit),
            or the reason it can't be done right now */}
        {!isConfirming && primaryAction && (
          <Button
            className="event-card-primary"
            type="button"
            variant="primary"
            size="sm"
            aria-label={`${primaryAction.label}: ${event.name}`}
            onClick={() => primaryAction.onClick(event)}
          >
            <primaryAction.icon aria-hidden="true" />
            {primaryAction.label}
          </Button>
        )}
        {!isConfirming && notice && (
          <p className="event-card-notice">
            <notice.icon aria-hidden="true" />
            {notice.text}
          </p>
        )}
        {!isConfirming && !preview && (
          <div className="event-card-actions">
            {/* A visible cue for mouse users; out of the Tab order and hidden
                from screen readers, because the title link already goes there */}
            <Button
              to={detailsPath}
              state={{ from: pathname }}
              variant="secondary"
              size="sm"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Eye aria-hidden="true" />
              View
            </Button>
            {canFavourite && (
              <button
                className={`event-favourite-button ${isFavourite ? "is-favourite" : ""} ${isPopping ? "is-popping" : ""}`}
                type="button"
                aria-label={
                  isFavourite ? "Remove from favourites" : "Add to favourites"
                }
                aria-pressed={isFavourite}
                onClick={() => {
                  if (!isFavourite) setIsPopping(true);
                  onToggleFavourite(event.eventId);
                }}
                onAnimationEnd={() => setIsPopping(false)}
              >
                <Heart
                  fill={isFavourite ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </button>
            )}
            {onAddToCalendar && (
              <Tooltip text={addToCalendar.label}>
                <button
                  className="event-calendar-button"
                  type="button"
                  aria-label={`${addToCalendar.label}: ${event.name}`}
                  onClick={() => onAddToCalendar(event)}
                >
                  <CalendarArrowDown aria-hidden="true" />
                </button>
              </Tooltip>
            )}
            {/* Organiser actions, shown when the page passes editTo/onDelete */}
            {editTo &&
              (isPast ? (
                <Button type="button" variant="secondary" size="sm" disabled>
                  <edit.icon aria-hidden="true" />
                  {edit.label}
                </Button>
              ) : (
                <Button
                  to={editTo}
                  state={{ from: pathname }}
                  variant="secondary"
                  size="sm"
                  aria-label={`${edit.label} ${event.name}`}
                >
                  <edit.icon aria-hidden="true" />
                  {edit.label}
                </Button>
              ))}
            {onDelete && (
              <Button
                ref={deleteRef}
                type="button"
                variant="danger"
                size="sm"
                aria-label={`${remove.label} ${event.name}`}
                disabled={isPast}
                onClick={() => setIsConfirming(true)}
              >
                <remove.icon aria-hidden="true" />
                {remove.label}
              </Button>
            )}
          </div>
        )}
        {/* Asked in the card, in place of the PHP confirm() pop-up: it takes
            the button row's place until answered. Escape keeps the event */}
        {isConfirming && (
          <div
            className="event-card-confirm"
            role="group"
            aria-label={`${confirmDelete.question} ${event.name}`}
            onKeyDown={(keyEvent) => keyEvent.key === "Escape" && closeConfirm()}
          >
            <p className="event-card-confirm-text">{confirmDelete.question}</p>
            <div className="event-card-confirm-actions">
              <Button ref={keepRef} type="button" variant="secondary" size="sm" onClick={closeConfirm}>
                {confirmDelete.cancel}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(event)}>
                <remove.icon aria-hidden="true" />
                {confirmDelete.confirm}
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
