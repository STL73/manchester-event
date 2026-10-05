import { useState } from "react";
import { SquarePen, Zap } from "lucide-react";
import Button from "../components/UI/Button";
import Tooltip from "../components/UI/Tooltip";
import {
  draftTableColumns,
  draftTooltips,
  myDraftsActions,
  myDraftsMessages,
} from "../data/myDraftsData";
import {
  editEventPath,
  organiserEventActions,
  organiserEventMessages,
} from "../data/organiserEventsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function MyDrafts({
  organiserEvents,
  onSubmitDraft,
  onDeleteEvent,
}) {
  const [message, setMessage] = useState("");
  const { edit, submitDraft, delete: remove } = organiserEventActions;

  // Matches get_draft_events(): drafts only, newest first
  const drafts = organiserEvents
    .filter((event) => event.status === "draft")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleSubmitDraft(eventId) {
    onSubmitDraft(eventId);
    setMessage(organiserEventMessages.draftSubmitted);
  }

  function handleDelete(eventId) {
    if (!window.confirm(myDraftsMessages.confirmDelete)) return;
    onDeleteEvent(eventId);
    setMessage(myDraftsMessages.draftDeleted);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-actions-title"
      >
        <h2 className="dashboard-title" id="quick-actions-title">
          <Zap className="dashboard-title-icon" aria-hidden="true" />
          Quick Actions
        </h2>
        <div className="dashboard-actions">
          {myDraftsActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="my-drafts-title"
      >
        <h2 className="dashboard-title" id="my-drafts-title">
          <SquarePen className="dashboard-title-icon" aria-hidden="true" />
          My Draft Events
        </h2>

        {message && (
          <div className="success-message table-message" role="status">
            <p>{message}</p>
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{myDraftsMessages.noDrafts}</p>
          </div>
        ) : (
          <div
            className="table-wrapper"
            tabIndex="0"
            role="region"
            aria-labelledby="my-drafts-title"
          >
            <table className="data-table">
              <thead>
                <tr>
                  {draftTableColumns.map((column) => (
                    <th scope="col" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.eventId}>
                    <td className="table-cell-wrap">{draft.name}</td>
                    <td>{draft.category}</td>
                    <td>{dateFormatter.format(new Date(draft.createdAt))}</td>
                    <td>{dateFormatter.format(new Date(draft.updatedAt))}</td>
                    <td>
                      <div className="table-actions">
                        <Tooltip text={draftTooltips.edit}>
                          <Button
                            to={editEventPath(draft.eventId)}
                            state={{ from: "/dashboard/my-drafts" }}
                            variant="secondary"
                            size="icon"
                            aria-label={`${draftTooltips.edit}: ${draft.name}`}
                          >
                            <edit.icon
                             
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                        <Tooltip text={draftTooltips.submit}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            aria-label={`${draftTooltips.submit}: ${draft.name}`}
                            onClick={() => handleSubmitDraft(draft.eventId)}
                          >
                            <submitDraft.icon
                             
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                        <Tooltip text={draftTooltips.delete}>
                          <Button
                            type="button"
                            variant="danger"
                            size="icon"
                            aria-label={`${draftTooltips.delete}: ${draft.name}`}
                            onClick={() => handleDelete(draft.eventId)}
                          >
                            <remove.icon
                             
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
