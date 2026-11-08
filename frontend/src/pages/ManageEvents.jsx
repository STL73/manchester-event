import { useMemo, useRef, useState } from "react";
import Button from "../components/UI/Button";
import FilterPills from "../components/UI/FilterPills";
import Pagination from "../components/UI/Pagination";
import SidePanel from "../components/UI/SidePanel";
import SortSelect from "../components/UI/SortSelect";
import StatusMessage from "../components/UI/StatusMessage";
import SearchBar from "../components/events/SearchBar";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import PageLoading from "../components/UI/PageLoading";
import EventReview from "../components/admin/EventReview";
import { eventCategories, eventDetailsPath, eventLocations } from "../data/eventsData";
import { eventState, statusLabel } from "../lib/eventStatus";
import {
  eventPanel,
  eventSortOptions,
  eventViews,
  manageEventsDecisions,
  manageEventsMessages,
  manageEventsPage,
} from "../data/manageEventsData";
import { daysSince, formatDayMonth, formatShortDayTime } from "../lib/formatDates";
import { fieldErrors } from "../lib/api";
import { readPage, useUrlParams } from "../hooks/useUrlParams";

// The search bar's fields; view, sort, page and the open panel live in the
// URL too, so a link (or Back) brings the same list back
const defaultFilters = { q: "", category: "", location: "" };

function readFilters(searchParams) {
  return Object.fromEntries(
    Object.keys(defaultFilters).map((key) => [key, searchParams.get(key) ?? ""]),
  );
}

// When it was last sent to an admin
function submittedAt(event) {
  return event.orgUpdatedAt ?? event.createdAt;
}

// The line under an event's name: what happened to it last
function contextLine(event, state, now, currentUserId) {
  const { context } = manageEventsPage;
  const byYou = event.adminId === currentUserId ? "you" : event.adminName;
  if (state === "pending") {
    const days = daysSince(submittedAt(event), now);
    return event.approvedSnapshot ? context.pendingEdit(days) : context.pending(days);
  }
  if (state === "approved" && event.adminUpdatedAt) {
    return context.approved(formatDayMonth(event.adminUpdatedAt), byYou);
  }
  if (state === "rejected" && event.adminUpdatedAt) {
    return context.rejected(formatDayMonth(event.adminUpdatedAt), byYou);
  }
  // A reason on a cancelled event means an admin took it down
  if (state === "cancelled" && event.rejectionReason && event.adminUpdatedAt) {
    return context.takenDown(formatDayMonth(event.adminUpdatedAt), byYou);
  }
  return context[state] ?? "";
}

const sorters = {
  // The queue first, the longest waiting at the top; then everything else
  // newest first
  waiting: (a, b) =>
    (a.state === "pending" ? 0 : 1) - (b.state === "pending" ? 0 : 1) ||
    (a.state === "pending"
      ? submittedAt(a.event).localeCompare(submittedAt(b.event))
      : b.event.createdAt.localeCompare(a.event.createdAt)),
  newest: (a, b) => b.event.createdAt.localeCompare(a.event.createdAt),
  soonest: (a, b) => a.event.startDatetime.localeCompare(b.event.startDatetime),
  az: (a, b) => a.event.name.localeCompare(b.event.name),
};

// Manage Events (decided 2026-10-12, layout A): opens on the review queue;
// a row opens the event in a side panel, where a pending one is approved or
// rejected with a reason, and a live one can be taken down (cancelled, with a
// reason; decided 2026-11-03). `events` is App's list from GET /events/manage
// (no drafts), null while it loads. Each decision awaits the server (Phase 7)
export default function ManageEvents({ events, currentUserId, onDecide }) {
  const { searchParams, setParams, setPage } = useUrlParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [decision, setDecision] = useState("approve");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [message, setMessage] = useState("");
  // The server's refusal, shown in the panel, and whether a decision is on its way
  const [panelError, setPanelError] = useState("");
  const [saving, setSaving] = useState(false);
  const listRef = useRef(null);
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () => (events ?? []).map((event) => ({ event, state: eventState(event, now) })),
    [events, now],
  );
  const counts = rows.reduce(
    (totals, { state }) => ({ ...totals, [state]: (totals[state] ?? 0) + 1 }),
    { all: rows.length },
  );
  const pendingEdits = rows.filter(({ state, event }) => state === "pending" && event.approvedSnapshot).length;

  const viewParam = searchParams.get("view");
  const view = eventViews.options.some((option) => option.value === viewParam) ? viewParam : "pending";
  const sortParam = searchParams.get("sort");
  const sort = sortParam in sorters ? sortParam : "waiting";
  const openId = Number(searchParams.get("open"));
  const openRow = rows.find(({ event }) => event.eventId === openId);

  const filtered = useMemo(() => {
    const applied = readFilters(searchParams);
    const query = applied.q.trim().toLowerCase();
    return rows
      .filter(({ event, state }) => {
        const text = `${event.name} ${event.organiser} ${event.description ?? ""}`.toLowerCase();
        return (
          (view === "all" || state === view) &&
          (!applied.category || event.categoryId === applied.category) &&
          (!applied.location || event.locationId === applied.location) &&
          (!query || text.includes(query))
        );
      })
      .sort(sorters[sort]);
  }, [rows, searchParams, view, sort]);

  const { pageSize } = manageEventsPage;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = readPage(searchParams, pageCount);
  const firstIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(firstIndex, firstIndex + pageSize);

  function openPanel(eventId) {
    setDecision("approve");
    setReason("");
    setReasonError("");
    setPanelError("");
    setMessage("");
    setParams({ open: eventId });
  }

  function closePanel() {
    setParams({ open: null });
  }

  function handleSearch(submitEvent) {
    submitEvent.preventDefault();
    setParams({ ...filters, page: null });
  }

  function handleFilterChange(changeEvent) {
    const { name, value } = changeEvent.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  // The panel stays open with the server's reason if it refuses: an event
  // another admin decided first, or one whose time has passed
  async function handleDecision() {
    const { event } = openRow;
    if (decision !== "approve" && !reason.trim()) {
      setReasonError(decision === "takeDown" ? eventPanel.takeDown.reasonRequired : eventPanel.reasonRequired);
      document.getElementById("reject-reason")?.focus();
      return;
    }
    setSaving(true);
    setPanelError("");
    try {
      if (decision === "approve") await onDecide(event.eventId, "approve");
      else await onDecide(event.eventId, decision === "takeDown" ? "take-down" : "reject", reason.trim());
    } catch (error) {
      const reasonRefused = fieldErrors(error).reason;
      if (reasonRefused) setReasonError(reasonRefused);
      else setPanelError(error.message);
      return;
    } finally {
      setSaving(false);
    }
    setMessage(manageEventsDecisions[decision]);
    closePanel();
  }

  if (events === null) return <PageLoading />;

  const viewOptions = eventViews.options.map((option) => ({ ...option, count: counts[option.value] ?? 0 }));
  const isReview = openRow && (openRow.state === "pending" || decision === "takeDown");
  const action = { approve: eventPanel.approve, reject: eventPanel.reject, takeDown: eventPanel.takeDown }[decision];

  const panelFooter = openRow ? (
    isReview ? (
      <Button
        type="button"
        variant={decision === "approve" ? "primary" : "danger"}
        size="md"
        disabled={saving}
        onClick={handleDecision}
      >
        <action.icon aria-hidden="true" />
        {action.submit}
      </Button>
    ) : (
      <>
        {openRow.state === "approved" && (
          <Button type="button" variant="danger" size="md" onClick={() => setDecision("takeDown")}>
            <eventPanel.takeDown.icon aria-hidden="true" />
            {eventPanel.takeDown.label}
          </Button>
        )}
        <Button
          to={eventDetailsPath(openRow.event.eventId, true)}
          state={{ from: `/dashboard/manage-events?${searchParams}` }}
          variant="secondary"
          size="md"
        >
          <eventPanel.openPage.icon aria-hidden="true" />
          {eventPanel.openPage.label}
        </Button>
      </>
    )
  ) : null;

  return (
    <div className="dashboard-page">
      <section className="dashboard-section" aria-labelledby="manage-events-title">
        <DashboardPageHeading
          id="manage-events-title"
          icon={manageEventsPage.icon}
          title={manageEventsPage.title}
          summary={
            <>
              {counts.pending ? (
                <button className="dashboard-summary-link" type="button" onClick={() => setParams({ view: null, page: null })}>
                  <strong>{counts.pending}</strong> {manageEventsPage.summary.waiting}
                </button>
              ) : (
                manageEventsPage.summary.none
              )}
              {pendingEdits > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  {manageEventsPage.summary.edits(pendingEdits)}
                </>
              )}
              <span aria-hidden="true"> · </span>
              {manageEventsPage.summary.total(rows.length)}
            </>
          }
        />

        {message && <StatusMessage className="table-message">{message}</StatusMessage>}

        {rows.length === 0 ? (
          <EmptyState icon={manageEventsPage.icon} text={manageEventsMessages.noEvents} />
        ) : (
          <>
            <SearchBar
              filters={filters}
              categories={eventCategories}
              locations={eventLocations}
              onChange={handleFilterChange}
              onSubmit={handleSearch}
             
              placeholder={manageEventsPage.searchPlaceholder}
             
            />
            <div className="events-when-row">
              <FilterPills
                label={eventViews.label}
                options={viewOptions}
                value={view}
                onChange={(next) => setParams({ view: next === "pending" ? null : next, page: null })}
              />
              <div className="events-when-tools">
                <SortSelect
                  label="Sort events"
                  options={eventSortOptions}
                  value={sort}
                  onChange={(next) => setParams({ sort: next === "waiting" ? null : next, page: null })}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={manageEventsPage.icon} text={view === "pending" ? manageEventsPage.summary.none : manageEventsMessages.noEvents} />
            ) : (
              <ul className="panel list-panel admin-list admin-list-events" ref={listRef}>
                <li className="group-label admin-list-head" aria-hidden="true">
                  <span>Event</span>
                  <span>Organiser</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span />
                </li>
                {pageRows.map(({ event, state }) => (
                  <li className={`list-row admin-row ${openId === event.eventId ? "is-open" : ""}`} key={event.eventId}>
                    <div className="admin-row-main">
                      <img className="admin-row-thumb" src={event.image} alt="" loading="lazy" />
                      <div className="admin-row-text">
                        {/* The whole row opens the panel (see .admin-row-open) */}
                        <button className="admin-row-open" type="button" onClick={() => openPanel(event.eventId)}>
                          {event.name}
                        </button>
                        <span className="admin-row-sub">
                          {state === "pending" && event.approvedSnapshot && (
                            <span className="badge tone-accent">{manageEventsPage.editOfLive}</span>
                          )}
                          {contextLine(event, state, now, currentUserId)}
                        </span>
                      </div>
                    </div>
                    <span className="admin-row-cell admin-row-hide">{event.organiser}</span>
                    <span className="admin-row-cell admin-row-meta">{formatShortDayTime(event.startDatetime)}</span>
                    <span className="admin-row-status">
                      <span className={`badge status-${state}`}>{statusLabel(state)}</span>
                    </span>
                    <span className="admin-row-action" aria-hidden="true">
                      <span className={`admin-row-cue ${state === "pending" ? "is-primary" : ""}`}>
                        {state === "pending" ? manageEventsPage.review : manageEventsPage.open}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={(next) => {
                setPage(next);
                listRef.current?.scrollIntoView({ block: "start" });
              }}
              summary={manageEventsPage.paging(firstIndex + 1, firstIndex + pageRows.length, filtered.length)}
            />
          </>
        )}

        <SidePanel
          open={Boolean(openRow)}
          title={openRow?.state === "pending" ? eventPanel.reviewTitle : eventPanel.title}
          titleId="event-panel-title"
          onClose={closePanel}
          footer={panelFooter}
        >
          {panelError && <StatusMessage variant="error">{panelError}</StatusMessage>}
          {openRow && (
            <EventReview
              event={openRow.event}
              state={openRow.state}
              events={events}
              decision={decision}
              onDecision={(next) => {
                setDecision(next);
                setReasonError("");
                setPanelError("");
              }}
              reason={reason}
              onReason={(next) => {
                setReason(next);
                setReasonError("");
              }}
              reasonError={reasonError}
            />
          )}
        </SidePanel>
      </section>
    </div>
  );
}
