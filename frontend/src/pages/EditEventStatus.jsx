import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import StatusMessage from "../components/UI/StatusMessage";
import {
  editableEventStatuses,
  eventActions,
  eventStatuses,
  manageEventsMessages,
} from "../data/manageEventsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusOptions = eventStatuses.filter(({ value }) =>
  editableEventStatuses.includes(value),
);

export default function EditEventStatus({ events, onUpdateEventStatus }) {
  const { eventId } = useParams();
  const event = events.find((item) => String(item.eventId) === eventId);
  const [status, setStatus] = useState(event?.status ?? "");
  const [message, setMessage] = useState("");
  const { edit, goBack, updateStatus } = eventActions;

  // Matches edit_status_events_contr: past events cannot be edited;
  // cancelled ones have no Edit button, so they are blocked here too
  const lockedMessage =
    event?.status === "past"
      ? manageEventsMessages.pastNotEditable
      : event?.status === "cancelled"
        ? manageEventsMessages.cancelledNotEditable
        : "";

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    onUpdateEventStatus(event.eventId, status);
    setMessage(manageEventsMessages.statusUpdated);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="edit-event-title"
      >
        <div className="section-heading-row">
          <h2 className="dashboard-title" id="edit-event-title">
            <edit.icon className="dashboard-title-icon" aria-hidden="true" />
            Edit Event Status
          </h2>
          <Button to={goBack.to} variant="primary" size="sm">
            <goBack.icon aria-hidden="true" />
            {goBack.label}
          </Button>
        </div>

        {!event ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">
              {manageEventsMessages.eventNotFound}
            </p>
          </div>
        ) : (
          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit}>
              {(message || lockedMessage) && (
                <StatusMessage variant={message ? "success" : "error"}>
                  {message || lockedMessage}
                </StatusMessage>
              )}

              <div className="profile-form-grid">
                <div className="contact-field">
                  <label htmlFor="edit-event-name">Event Name</label>
                  <input
                    className="profile-readonly"
                    id="edit-event-name"
                    type="text"
                    value={event.name}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-event-status">Status</label>
                  {lockedMessage ? (
                    <input
                      className="profile-readonly capitalize"
                      id="edit-event-status"
                      type="text"
                      value={event.status}
                      readOnly
                    />
                  ) : (
                    <select
                      className="form-select"
                      id="edit-event-status"
                      name="status"
                      value={status}
                      onChange={(changeEvent) => {
                        setStatus(changeEvent.target.value);
                        setMessage("");
                      }}
                    >
                      {statusOptions.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-event-admin">Admin Updated By</label>
                  <input
                    className="profile-readonly"
                    id="edit-event-admin"
                    type="text"
                    value={
                      event.adminName
                        ? `${event.adminName} (ID: ${event.adminId})`
                        : "—"
                    }
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-event-updated">Admin Updated At</label>
                  <input
                    className="profile-readonly"
                    id="edit-event-updated"
                    type="text"
                    value={
                      event.adminUpdatedAt
                        ? dateFormatter.format(new Date(event.adminUpdatedAt))
                        : "—"
                    }
                    readOnly
                  />
                </div>
              </div>

              {!lockedMessage && (
                <div className="dashboard-flex">
                  <Button type="submit" variant="primary" size="md">
                    <updateStatus.icon
                     
                      aria-hidden="true"
                    />
                    {updateStatus.label}
                  </Button>
                </div>
              )}
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
