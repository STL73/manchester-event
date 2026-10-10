import { ClipboardList } from "lucide-react";
import Button from "../components/UI/Button";
import { eventDetailsPath } from "../data/eventsData";
import Tooltip from "../components/UI/Tooltip";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import {
  eventActions,
  eventStatuses,
  eventTableColumns,
  manageEventsActions,
  manageEventsMessages,
} from "../data/manageEventsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusLabels = Object.fromEntries(
  eventStatuses.map(({ value, label }) => [value, label]),
);

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

export default function ManageEvents({ events }) {
  const ViewIcon = eventActions.view.icon;
  const EditIcon = eventActions.edit.icon;

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="manage-events-title"
      >
        <DashboardPageHeading
          id="manage-events-title"
          icon={ClipboardList}
          title="Manage Events"
          actions={manageEventsActions}
        />

        {events.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">
              {manageEventsMessages.noEvents}
            </p>
          </div>
        ) : (
          <div
            className="table-wrapper"
            tabIndex="0"
            role="region"
            aria-labelledby="manage-events-title"
          >
            <table className="data-table">
              <thead>
                <tr>
                  {eventTableColumns.map((column) => (
                    <th scope="col" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const isCancelled = event.status === "cancelled";
                  const isPast = event.status === "past";

                  return (
                    <tr
                      className={
                        isCancelled
                          ? "table-row-cancelled"
                          : isPast
                            ? "table-row-past"
                            : ""
                      }
                      key={event.eventId}
                    >
                      <td>{event.eventId}</td>
                      <td className="table-cell-wrap">{event.name}</td>
                      <td>
                        <div className="table-cell-stack">
                          <span>{event.organiser}</span>
                          <span className="table-cell-secondary">
                            ID: {event.organiserId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${event.status}`}
                        >
                          {statusLabels[event.status] ?? event.status}
                        </span>
                      </td>
                      <td>
                        {/* Cancelled events hide the admin update, as in the PHP */}
                        {!isCancelled && event.adminName ? (
                          <div className="table-cell-stack">
                            <span>{event.adminName}</span>
                            <span className="table-cell-secondary">
                              ID: {event.adminId}
                            </span>
                            <span className="table-cell-secondary">
                              {formatDate(event.adminUpdatedAt)}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{formatDate(event.orgUpdatedAt)}</td>
                      <td>
                        <div className="table-actions">
                          <Tooltip text={eventActions.view.tooltip}>
                            <Button
                              to={eventDetailsPath(event.eventId, true)}
                              state={{ from: "/dashboard/manage-events" }}
                              variant="secondary"
                              size="icon"
                              aria-label={`${eventActions.view.tooltip}: ${event.name}`}
                            >
                              <ViewIcon
                               
                                aria-hidden="true"
                              />
                            </Button>
                          </Tooltip>
                          {isPast && (
                            <Tooltip text={eventActions.pastLocked.tooltip}>
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                aria-label={`${eventActions.edit.tooltip}: ${event.name}. ${eventActions.pastLocked.tooltip}`}
                                disabled
                              >
                                <EditIcon
                                 
                                  aria-hidden="true"
                                />
                              </Button>
                            </Tooltip>
                          )}
                          {!isPast && !isCancelled && (
                            <Tooltip text={eventActions.edit.tooltip}>
                              <Button
                                to={`/dashboard/manage-events/${event.eventId}/edit`}
                                variant="secondary"
                                size="icon"
                                aria-label={`${eventActions.edit.tooltip}: ${event.name}`}
                              >
                                <EditIcon
                                 
                                  aria-hidden="true"
                                />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
