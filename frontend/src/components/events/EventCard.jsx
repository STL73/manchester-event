import { CalendarDays, Eye, Heart, MapPin, Tag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Button from "../UI/Button";
import { eventDetailsPath } from "../../data/eventsData";
import { organiserEventActions } from "../../data/organiserEventsData";

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
  editTo,
  onDelete,
}) {
  const { edit, delete: remove } = organiserEventActions;
  // Cards on dashboard pages open the details inside the dashboard
  const { pathname } = useLocation();
  const inDashboard = pathname.startsWith("/dashboard");
  // Past events can be viewed but not edited or deleted, as in the PHP
  const isPast = status === "past";
  const detailsPath = eventDetailsPath(event.eventId, inDashboard);

  // The whole card opens the event: the title link is stretched over the
  // card (see .event-card-link), and the action buttons sit above it
  return (
    <article className="event-card">
      <div className="event-card-media">
        <img
          className="event-card-image"
          src={event.image}
          alt={event.name}
          style={{ objectPosition: event.imagePosition }}
        />
      </div>
      <div className="event-card-content">
        {status && (
          <span className={`status-badge status-${status} event-card-status`}>
            {status}
          </span>
        )}
        <p className="event-card-category">
          <Tag className="event-card-icon" aria-hidden="true" />
          {event.category}
        </p>
        <h2 className="event-card-title">
          <Link to={detailsPath} state={{ from: pathname }} className="event-card-link">
            {event.name}
          </Link>
        </h2>
        <p className="event-card-detail">
          <MapPin className="event-card-icon" aria-hidden="true" />
          {event.location}
        </p>
        <p className="event-card-detail">
          <CalendarDays className="event-card-icon" aria-hidden="true" />
          {dateFormatter.format(new Date(event.startDatetime))}
        </p>
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
              className={`event-favourite-button ${isFavourite ? "is-favourite" : ""}`}
              type="button"
              aria-label={
                isFavourite ? "Remove from favourites" : "Add to favourites"
              }
              aria-pressed={isFavourite}
              onClick={() => onToggleFavourite(event.eventId)}
            >
              <Heart
                fill={isFavourite ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
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
              type="button"
              variant="danger"
              size="sm"
              aria-label={`${remove.label} ${event.name}`}
              disabled={isPast}
              onClick={() => onDelete(event)}
            >
              <remove.icon aria-hidden="true" />
              {remove.label}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
