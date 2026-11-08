import { CalendarDays, MapPin, Ticket, UserRound } from "lucide-react";
import FormField from "../UI/FormField";
import PeriodSwitcher from "../UI/PeriodSwitcher";
import { statusLabel } from "../../lib/eventStatus";
import { eventPanel, manageEventsPage } from "../../data/manageEventsData";
import { formatLongDay, formatShortDayTime, formatTimeRange } from "../../lib/formatDates";

// What differs between the approved snapshot and the edit waiting
function changedFields(event) {
  const { fields, updated } = eventPanel.changes;
  const snapshot = event.approvedSnapshot;
  if (!snapshot) return [];
  const show = (key, value) =>
    key === "startDatetime" || key === "endDatetime"
      ? value
        ? formatShortDayTime(value)
        : "—"
      : value;

  // Dates compare to the minute: the form saves "19:30", the record "19:30:00"
  const comparable = (key, value) =>
    (key === "startDatetime" || key === "endDatetime") && value ? value.slice(0, 16) : (value ?? null);

  return Object.keys(fields)
    .filter((key) => comparable(key, snapshot[key]) !== comparable(key, event[key]))
    .map((key) =>
      key === "description" || key === "image"
        ? { key, label: fields[key], summary: updated }
        : { key, label: fields[key], was: show(key, snapshot[key]), now: show(key, event[key]) },
    );
}

// Manage Events' side panel: the whole event, what an edit of a live event
// changed, and the decision (Approve / Reject with a reason, or Cancel this
// event for a live one). The page owns the decision and does the saving
export default function EventReview({ event, state, events, decision, onDecision, reason, onReason, reasonError }) {
  const changes = changedFields(event);
  const organiserEvents = events.filter((item) => item.organiserId === event.organiserId);
  const rejectedCount = organiserEvents.filter((item) => item.status === "rejected").length;
  const pending = state === "pending";

  return (
    <div className="admin-review">
      <img className="admin-review-photo" src={event.image} alt="" />
      <div className="flex flex-col gap-2">
        <div className="admin-review-badges">
          <span className={`badge status-${state}`}>{statusLabel(state)}</span>
          {event.approvedSnapshot && pending && <span className="badge tone-accent">{manageEventsPage.editOfLive}</span>}
        </div>
        <h3 className="admin-review-name">{event.name}</h3>
      </div>

      {pending && changes.length > 0 && (
        <section className="callout callout-compact tone-accent admin-changes" aria-label={eventPanel.changes.title}>
          <p className="admin-changes-title">
            <eventPanel.changes.icon aria-hidden="true" />
            {eventPanel.changes.title}
          </p>
          <ul>
            {changes.map((change) => (
              <li key={change.key}>
                {change.label}:{" "}
                {change.summary ?? (
                  <>
                    <del>{change.was || "—"}</del> → <ins>{change.now || "—"}</ins>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="admin-changes-note">{eventPanel.changes.note}</p>
        </section>
      )}

      <ul className="event-details-facts">
        <li className="event-details-fact">
          <CalendarDays aria-hidden="true" />
          <p>
            <strong>{formatLongDay(event.startDatetime)}</strong>
            {formatTimeRange(event)}
          </p>
        </li>
        <li className="event-details-fact">
          <MapPin aria-hidden="true" />
          <p>
            <strong>{event.location}</strong>
            {event.address}
          </p>
        </li>
        <li className="event-details-fact">
          <UserRound aria-hidden="true" />
          <p>
            <strong>{event.organiser}</strong>
            {eventPanel.organiserStats(organiserEvents.length, rejectedCount)}
          </p>
        </li>
        {event.externalLink && (
          <li className="event-details-fact">
            <Ticket aria-hidden="true" />
            <p>
              <strong>{eventPanel.ticketLink}</strong>
              <a className="event-details-fact-link" href={event.externalLink} target="_blank" rel="noreferrer">
                {event.externalLink.replace(/^https?:\/\//, "")} ↗
              </a>
            </p>
          </li>
        )}
      </ul>

      {event.description && <p className="admin-review-description">{event.description}</p>}

      {["rejected", "cancelled"].includes(state) && event.rejectionReason && (
        <p className="callout callout-compact admin-note">
          <strong>{eventPanel.rejectedReason}</strong>
          {event.rejectionReason}
        </p>
      )}

      {(pending || decision === "takeDown") && (
        <div className="admin-decision">
          {pending && (
            <PeriodSwitcher
              label={eventPanel.decisionLabel}
              options={[
                { value: "approve", label: eventPanel.approve.label },
                { value: "reject", label: eventPanel.reject.label },
              ]}
              value={decision}
              onChange={onDecision}
            />
          )}
          {decision !== "approve" ? (
            <FormField
              id="reject-reason"
              type="textarea"
              rows="3"
              label={eventPanel.reasonLabel}
              hint={eventPanel.reasonHint}
              placeholder={decision === "takeDown" ? eventPanel.takeDown.reasonPlaceholder : eventPanel.reasonPlaceholder}
              value={reason}
              onChange={(changeEvent) => onReason(changeEvent.target.value)}
              error={reasonError}
            />
          ) : (
            <p className="callout callout-compact admin-note">{event.approvedSnapshot ? eventPanel.approveEditNote : eventPanel.approveNote}</p>
          )}
        </div>
      )}

      {state === "approved" && decision !== "takeDown" && <p className="callout callout-compact admin-note">{eventPanel.liveNote}</p>}
    </div>
  );
}
