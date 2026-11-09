import { Link } from "react-router-dom";
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
import { formatDayMonth } from "../lib/formatDates";
import { useDeleteEvent } from "../hooks/useDeleteEvent";

// The organiser's drafts as cards, so each looks as it will once live, with
// Submit as the main action
export default function MyDrafts({
  organiserEvents,
  onSubmitDraft,
  onDeleteEvent,
}) {
  // { text, variant }, or { type: "submitted" }, the one that links
  const { message, setMessage, deleteEvent } = useDeleteEvent(onDeleteEvent, myDraftsMessages.draftDeleted);
  const { submitDraft } = organiserEventActions;
  const now = new Date();

  // Drafts only, most recently edited first
  const drafts = organiserEvents
    .filter((event) => event.status === "draft")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const lastEdited = drafts[0] && new Date(drafts[0].updatedAt);

  // Each awaits the server, which may refuse (an unverified email, a start
  // that has passed since the page loaded); its reason shows in red
  async function handleSubmit(event) {
    setMessage(null);
    try {
      await onSubmitDraft(event.eventId);
      setMessage({ type: "submitted" });
    } catch (error) {
      setMessage({ text: error.message, variant: "error" });
    }
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
                {myDraftsSummary.lastEdited} {formatDayMonth(lastEdited)}
              </>
            )
          }
        />

        {message && (
          <StatusMessage variant={message.variant} className="table-message">
            {message.type === "submitted" ? (
              <>
                {submitted.text}{" "}
                <Link to={submitted.to} className="dashboard-greeting-link">
                  {submitted.link}
                </Link>
                .
              </>
            ) : (
              message.text
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
                    text: `${lastEditedNote.text} ${formatDayMonth(draft.updatedAt)}`,
                  }}
                  primaryAction={
                    canSubmit
                      ? { label: submitDraft.label, icon: submitDraft.icon, onClick: handleSubmit }
                      : undefined
                  }
                  notice={canSubmit ? undefined : datePassedNotice}
                  editTo={editEventPath(draft.eventId)}
                  onDelete={deleteEvent}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
