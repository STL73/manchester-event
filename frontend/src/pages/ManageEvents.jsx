import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, MapPin, Ticket, UserRound } from "lucide-react";
import Button from "../components/UI/Button";
import FieldError from "../components/UI/FieldError";
import FilterPills from "../components/UI/FilterPills";
import Pagination from "../components/UI/Pagination";
import SidePanel from "../components/UI/SidePanel";
import SortSelect from "../components/UI/SortSelect";
import StatusMessage from "../components/UI/StatusMessage";
import PeriodSwitcher from "../components/charts/PeriodSwitcher";
import SearchBar from "../components/events/SearchBar";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import {
  eventCategories,
  eventDetailsPath,
  eventLocations,
  eventState,
} from "../data/eventsData";
import {
  currentAdmin,
  eventPanel,
  eventSortOptions,
  eventStatuses,
  eventViews,
  manageEventsDecisions,
  manageEventsMessages,
  manageEventsPage,
} from "../data/manageEventsData";

const DAY = 24 * 60 * 60 * 1000;

const whenFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const longDayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const shortDateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

const statusLabels = Object.fromEntries(eventStatuses.map(({ value, label }) => [value, label]));

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

function daysSince(value, now) {
  return Math.max(0, Math.floor((now - new Date(value)) / DAY));
}

// The line under an event's name: what happened to it last
function contextLine(event, state, now) {
  const { context } = manageEventsPage;
  const byYou = event.adminId === currentAdmin.id ? "you" : event.adminName;
  if (state === "pending") {
    const days = daysSince(submittedAt(event), now);
    return event.approvedSnapshot ? context.pendingEdit(days) : context.pending(days);
  }
  if (state === "approved" && event.adminUpdatedAt) {
    return context.approved(shortDateFormatter.format(new Date(event.adminUpdatedAt)), byYou);
  }
  if (state === "rejected" && event.adminUpdatedAt) {
    return context.rejected(shortDateFormatter.format(new Date(event.adminUpdatedAt)), byYou);
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

// "19:30 – 23:00", or the end's day too when it is on another one
function timeRange(event) {
  const start = new Date(event.startDatetime);
  if (!event.endDatetime) return timeFormatter.format(start);
  const end = new Date(event.endDatetime);
  return `${timeFormatter.format(start)} – ${(start.toDateString() === end.toDateString() ? timeFormatter : whenFormatter).format(end)}`;
}

// What differs between the approved snapshot and the edit waiting
function changedFields(event) {
  const { fields, updated } = eventPanel.changes;
  const snapshot = event.approvedSnapshot;
  if (!snapshot) return [];
  const show = (key, value) =>
    key === "startDatetime" || key === "endDatetime"
      ? value
        ? whenFormatter.format(new Date(value))
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

function EventReview({ event, state, events, decision, onDecision, reason, onReason, reasonError }) {
  const changes = changedFields(event);
  const organiserEvents = events.filter((item) => item.organiserId === event.organiserId);
  const rejectedCount = organiserEvents.filter((item) => item.status === "rejected").length;
  const pending = state === "pending";

  return (
    <div className="admin-review">
      <img className="admin-review-photo" src={event.image} alt="" />
      <div className="flex flex-col gap-2">
        <div className="admin-review-badges">
          <span className={`badge status-${state}`}>{statusLabels[state] ?? state}</span>
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
            <strong>{longDayFormatter.format(new Date(event.startDatetime))}</strong>
            {timeRange(event)}
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

      {state === "rejected" && event.rejectionReason && (
        <p className="callout callout-compact admin-note">
          <strong>{eventPanel.rejectedReason}</strong>
          {event.rejectionReason}
        </p>
      )}

      {(pending || decision === "reject") && (
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
          {decision === "reject" ? (
            <div className="field">
              <label htmlFor="reject-reason">
                {eventPanel.reasonLabel} <span className="field-hint">({eventPanel.reasonHint})</span>
              </label>
              <textarea
                id="reject-reason"
                rows="3"
                placeholder={eventPanel.reasonPlaceholder}
                value={reason}
                aria-invalid={Boolean(reasonError)}
                aria-describedby={reasonError ? "reject-reason-error" : undefined}
                onChange={(changeEvent) => onReason(changeEvent.target.value)}
              />
              {reasonError && <FieldError id="reject-reason-error">{reasonError}</FieldError>}
            </div>
          ) : (
            <p className="callout callout-compact admin-note">{event.approvedSnapshot ? eventPanel.approveEditNote : eventPanel.approveNote}</p>
          )}
        </div>
      )}

      {state === "approved" && decision !== "reject" && <p className="callout callout-compact admin-note">{eventPanel.liveNote}</p>}
    </div>
  );
}

// Manage Events (decided 2026-10-12, layout A): opens on the review queue;
// a row opens the event in a side panel, where a pending one is approved or
// rejected with a reason. Matches get_all_events() (no drafts)
export default function ManageEvents({ events, onUpdateEventStatus }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [decision, setDecision] = useState("approve");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [message, setMessage] = useState("");
  const listRef = useRef(null);
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () => events.map((event) => ({ event, state: eventState(event, now) })),
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
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(firstIndex, firstIndex + pageSize);

  function setParams(changes) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  }

  function openPanel(eventId) {
    setDecision("approve");
    setReason("");
    setReasonError("");
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

  function handleDecision() {
    const { event } = openRow;
    if (decision === "reject") {
      if (!reason.trim()) {
        setReasonError(eventPanel.reasonRequired);
        document.getElementById("reject-reason")?.focus();
        return;
      }
      onUpdateEventStatus(event.eventId, "rejected", reason.trim());
      setMessage(manageEventsDecisions.rejected);
    } else {
      onUpdateEventStatus(event.eventId, "approved");
      setMessage(manageEventsDecisions.approved);
    }
    closePanel();
  }

  const viewOptions = eventViews.options.map((option) => ({ ...option, count: counts[option.value] ?? 0 }));
  const isReview = openRow && (openRow.state === "pending" || decision === "reject");

  const panelFooter = openRow ? (
    isReview ? (
      <Button
        type="button"
        variant={decision === "reject" ? "danger" : "primary"}
        size="md"
        onClick={handleDecision}
      >
        {decision === "reject" ? <eventPanel.reject.icon aria-hidden="true" /> : <eventPanel.approve.icon aria-hidden="true" />}
        {decision === "reject" ? eventPanel.reject.submit : eventPanel.approve.submit}
      </Button>
    ) : (
      <>
        {openRow.state === "approved" && (
          <Button type="button" variant="danger" size="md" onClick={() => setDecision("reject")}>
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
              showDate={false}
              placeholder={manageEventsPage.searchPlaceholder}
              className="events-search-no-date"
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
                          {contextLine(event, state, now)}
                        </span>
                      </div>
                    </div>
                    <span className="admin-row-cell admin-row-hide">{event.organiser}</span>
                    <span className="admin-row-cell admin-row-meta">{whenFormatter.format(new Date(event.startDatetime))}</span>
                    <span className="admin-row-status">
                      <span className={`badge status-${state}`}>{statusLabels[state] ?? state}</span>
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
                setParams({ page: next > 1 ? String(next) : null });
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
          {openRow && (
            <EventReview
              event={openRow.event}
              state={openRow.state}
              events={events}
              decision={decision}
              onDecision={(next) => {
                setDecision(next);
                setReasonError("");
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
