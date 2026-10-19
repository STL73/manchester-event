import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SquarePen } from "lucide-react";
import EventCard from "../components/events/EventCard";
import StatusMessage from "../components/UI/StatusMessage";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import { isUpcoming } from "../lib/eventDates";
import {
  datePassedNotice,
  lastEditedNote,
  myDraftsActions,
  myDraftsMessages,
  myDraftsSummary,
  myDraftsTitle,
} from "../data/myDraftsData";
import { editEventPath, organiserEventActions } from "../data/organiserEventsData";

const editedFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// The same cards as My Events (decided 2026-10-12; the PHP had a table), so
// a draft looks the way it will once live. Submit is each card's labelled
// main action; Edit and Delete sit under it, and Delete asks in the card
export default function MyDrafts({
  organiserEvents,
  onSubmitDraft,
  onDeleteEvent,
}) {
  // { type: "submitted" | "deleted" }, or { text } passed from Create Event
  // (a new draft) or Edit Event (a deleted one); the submitted one links
  const location = useLocation();
  const [message, setMessage] = useState(() =>
    location.state?.message ? { text: location.state.message } : null,
  );
  const { submitDraft } = organiserEventActions;
  const now = new Date();

  // Matches get_draft_events(): drafts only, most recently edited first
  const drafts = organiserEvents
    .filter((event) => event.status === "draft")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const lastEdited = drafts[0] && new Date(drafts[0].updatedAt);

  function handleSubmit(event) {
    onSubmitDraft(event.eventId);
    setMessage({ type: "submitted" });
  }

  // The card has already asked (see EventCard)
  function handleDelete(event) {
    onDeleteEvent(event.eventId);
    setMessage({ type: "deleted" });
  }

  const { submitted } = myDraftsMessages;

  return (
    <div className="dashboard-page">
      <section
        className="dashboard-section"
        aria-labelledby="my-drafts-title"
      >
        <DashboardPageHeading
          id="my-drafts-title"
          icon={SquarePen}
          title={myDraftsTitle}
          actions={myDraftsActions}
          summary={
            drafts.length === 0 ? (
              myDraftsSummary.none
            ) : (
              <>
                <strong>{drafts.length}</strong>{" "}
                {drafts.length === 1 ? myDraftsSummary.one : myDraftsSummary.many}
                <span aria-hidden="true"> · </span>
                {myDraftsSummary.lastEdited} {editedFormatter.format(lastEdited)}
              </>
            )
          }
        />

        {message && (
          <StatusMessage className="table-message">
            {message.type === "submitted" ? (
              <>
                {submitted.text}{" "}
                <Link to={submitted.to} className="dashboard-greeting-link">
                  {submitted.link}
                </Link>
                .
              </>
            ) : (
              (message.text ?? myDraftsMessages.draftDeleted)
            )}
          </StatusMessage>
        )}

        <div className="events-grid events-grid-three">
          {drafts.length === 0 ? (
            <EmptyState icon={SquarePen} text={myDraftsMessages.noDrafts} />
          ) : (
            drafts.map((draft) => {
              const canSubmit = isUpcoming(draft, now);
              return (
                <EventCard
                  key={draft.eventId}
                  event={draft}
                  status="draft"
                  note={{
                    icon: lastEditedNote.icon,
                    text: `${lastEditedNote.text} ${editedFormatter.format(new Date(draft.updatedAt))}`,
                  }}
                  primaryAction={
                    canSubmit
                      ? { label: submitDraft.label, icon: submitDraft.icon, onClick: handleSubmit }
                      : undefined
                  }
                  notice={canSubmit ? undefined : datePassedNotice}
                  editTo={editEventPath(draft.eventId)}
                  onDelete={handleDelete}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
