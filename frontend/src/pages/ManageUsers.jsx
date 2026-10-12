import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarCheck, MailCheck, MailWarning, Shield } from "lucide-react";
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
import { hasBeenPublic } from "../data/eventsData";
import {
  accountStatuses,
  manageUsersMessages,
  manageUsersPage,
  roleLabels,
  suspensionLengths,
  userPanel,
  userSortOptions,
  userViews,
} from "../data/manageUsersData";

const DAY = 24 * 60 * 60 * 1000;

const joinedFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const untilFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

const statusLabels = Object.fromEntries(accountStatuses.map(({ value, label }) => [value, label]));

// suspended_until for a suspension of so many days, from the moment of saving
function daysFromNow(days) {
  return new Date(Date.now() + days * DAY).toISOString();
}

// Two letters for the hexagon avatar
function initials(name) {
  return name.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
}

const sorters = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  az: (a, b) => a.username.localeCompare(b.username),
};

function matchesView(user, view) {
  if (view === "all") return true;
  if (view === "suspended") return user.accStatus === "suspended";
  if (view === "unverified") return !user.emailVerifiedAt;
  return user.role === view;
}

function suspensionText(user) {
  if (user.accStatus !== "suspended") return "";
  return user.suspendedUntil
    ? userPanel.suspendedUntil(untilFormatter.format(new Date(user.suspendedUntil)))
    : userPanel.suspendedOpen;
}

function Avatar({ user, large = false }) {
  return (
    <span className={`admin-avatar ${large ? "is-large" : ""}`} aria-hidden="true">
      {initials(user.username)}
    </span>
  );
}

function StatusBadges({ user }) {
  return (
    <>
      <span className={`status-badge status-${user.accStatus}`}>{statusLabels[user.accStatus] ?? user.accStatus}</span>
      {!user.emailVerifiedAt && <span className="status-badge status-unverified">Unverified</span>}
    </>
  );
}

// The panel's form: status, and for a suspension how long and why
function AccountForm({ user, isSelf, form, onChange, reasonError }) {
  if (isSelf) return <p className="admin-note">{userPanel.self}</p>;
  const suspended = form.accStatus === "suspended";
  const lengthOptions = [
    // An existing suspension can be kept as it is
    ...(user.accStatus === "suspended" ? [{ value: "keep", label: `Keep: ${suspensionText(user).toLowerCase()}` }] : []),
    ...suspensionLengths,
  ];

  return (
    <div className="admin-decision">
      <div className="admin-field">
        <span className="admin-field-label" id="account-status-label">
          {userPanel.statusLabel}
        </span>
        <PeriodSwitcher
          label={userPanel.statusLabel}
          options={accountStatuses}
          value={form.accStatus}
          onChange={(accStatus) => onChange({ accStatus })}
        />
      </div>
      {suspended && (
        <>
          <div className="contact-field">
            <label htmlFor="suspend-length">{userPanel.lengthLabel}</label>
            <select
              id="suspend-length"
              className="form-select"
              value={form.length}
              onChange={(changeEvent) => onChange({ length: changeEvent.target.value })}
            >
              {lengthOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="contact-field">
            <label htmlFor="suspend-reason">
              {userPanel.reasonLabel} <span className="admin-hint">({userPanel.reasonHint})</span>
            </label>
            <textarea
              id="suspend-reason"
              rows="3"
              placeholder={userPanel.reasonPlaceholder}
              value={form.reason}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? "suspend-reason-error" : undefined}
              onChange={(changeEvent) => onChange({ reason: changeEvent.target.value })}
            />
            {reasonError && <FieldError id="suspend-reason-error">{reasonError}</FieldError>}
          </div>
          <p className="admin-note">{userPanel.suspendedNote[user.role === "organiser" ? "organiser" : "user"]}</p>
        </>
      )}
    </div>
  );
}

function formFor(user) {
  return {
    accStatus: user.accStatus,
    length: user.accStatus === "suspended" ? "keep" : "7",
    reason: user.suspensionReason ?? "",
  };
}

// Manage Users (decided 2026-10-12, layout A): the accounts as a list; a row
// opens the account in a side panel to suspend or reactivate it (with how
// long and why) or, where the schema allows, delete it
export default function ManageUsers({ users, events, currentUserId, onUpdateUser, onDeleteUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [form, setForm] = useState(null);
  const [reasonError, setReasonError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState("");
  const listRef = useRef(null);

  const counts = Object.fromEntries(
    userViews.options.map((option) => [option.value, users.filter((user) => matchesView(user, option.value)).length]),
  );
  const suspendedCount = counts.suspended;
  const unverifiedCount = counts.unverified;

  const viewParam = searchParams.get("view");
  const view = userViews.options.some((option) => option.value === viewParam) ? viewParam : "all";
  const sortParam = searchParams.get("sort");
  const sort = sortParam in sorters ? sortParam : "newest";
  const openId = Number(searchParams.get("open"));
  const openUser = users.find((user) => user.userId === openId);
  const panelForm = openUser ? (form ?? formFor(openUser)) : null;

  const filtered = useMemo(() => {
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    return users
      .filter((user) => matchesView(user, view))
      .filter((user) => !q || `${user.username} ${user.email}`.toLowerCase().includes(q))
      .sort(sorters[sort]);
  }, [users, searchParams, view, sort]);

  const { pageSize } = manageUsersPage;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * pageSize;
  const pageUsers = filtered.slice(firstIndex, firstIndex + pageSize);

  function setParams(changes) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  }

  function openPanel(userId) {
    setForm(null);
    setReasonError("");
    setConfirmingDelete(false);
    setMessage("");
    setParams({ open: userId });
  }

  function closePanel() {
    setParams({ open: null });
  }

  // What the open account owns, for the delete rule: once any of its events
  // has been public it can only be suspended (the schema's rule)
  function accountFacts(user) {
    const own = events.filter((event) => event.organiserId === user.userId && event.status !== "draft");
    const hasPublic = own.some(hasBeenPublic);
    const isSelf = user.userId === currentUserId;
    const deleteBlock = user.role === "admin" ? "admin" : hasPublic ? "publicEvents" : null;
    return { count: own.length, hasPublic, isSelf, canDelete: !isSelf && !deleteBlock, deleteBlock };
  }

  function handleSave() {
    const { accStatus, length, reason } = panelForm;
    if (accStatus === "suspended" && !reason.trim()) {
      setReasonError(userPanel.reasonRequired);
      document.getElementById("suspend-reason")?.focus();
      return;
    }
    const days = suspensionLengths.find((option) => option.value === length)?.days;
    const suspendedUntil =
      length === "keep"
        ? openUser.suspendedUntil
        : days
          ? daysFromNow(days)
          : null;
    onUpdateUser(openUser.userId, { accStatus, suspendedUntil, suspensionReason: reason.trim() || null });
    setMessage(manageUsersMessages.statusUpdated);
    closePanel();
  }

  function handleDelete() {
    onDeleteUser(openUser.userId);
    setMessage(manageUsersMessages.userDeleted);
    closePanel();
  }

  const viewOptions = userViews.options.map((option) => ({ ...option, count: counts[option.value] }));
  const facts = openUser ? accountFacts(openUser) : null;
  const { delete: remove } = userPanel;

  const panelFooter =
    openUser && !facts.isSelf ? (
      <>
        <Button type="button" variant="primary" size="md" onClick={handleSave}>
          <userPanel.save.icon aria-hidden="true" />
          {userPanel.save.label}
        </Button>
        <div className="admin-danger-line">
          {facts.canDelete ? (
            confirmingDelete ? (
              <>
                <span>{remove.question}</span>
                <span className="admin-danger-actions">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                    {remove.keep}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                    <remove.icon aria-hidden="true" />
                    {remove.confirm}
                  </Button>
                </span>
              </>
            ) : (
              <>
                <span>{remove.text}</span>
                <Button type="button" variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
                  <remove.icon aria-hidden="true" />
                  {remove.button}
                </Button>
              </>
            )
          ) : (
            <span>{userPanel.noDelete[facts.deleteBlock]}</span>
          )}
        </div>
      </>
    ) : null;

  return (
    <div className="dashboard-home">
      <section className="dashboard-section" aria-labelledby="manage-users-title">
        <DashboardPageHeading
          id="manage-users-title"
          icon={manageUsersPage.icon}
          title={manageUsersPage.title}
          summary={
            <>
              <strong>{users.length}</strong> {manageUsersPage.summary.accounts(users.length)}
              {suspendedCount > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <strong>{suspendedCount}</strong> {manageUsersPage.summary.suspended}
                </>
              )}
              {unverifiedCount > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  {manageUsersPage.summary.unverified(unverifiedCount)}
                </>
              )}
            </>
          }
        />

        {message && <StatusMessage className="table-message">{message}</StatusMessage>}

        {users.length === 0 ? (
          <EmptyState icon={manageUsersPage.icon} text={manageUsersMessages.noUsers} />
        ) : (
          <>
            <SearchBar
              filters={{ q: query }}
              onChange={(changeEvent) => setQuery(changeEvent.target.value)}
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                setParams({ q: query.trim(), page: null });
              }}
              showDate={false}
              showFilters={false}
              placeholder={manageUsersPage.searchPlaceholder}
              className="events-search-keywords-only"
            />
            <div className="events-when-row">
              <FilterPills
                label={userViews.label}
                options={viewOptions}
                value={view}
                onChange={(next) => setParams({ view: next === "all" ? null : next, page: null })}
              />
              <div className="events-when-tools">
                <SortSelect
                  label="Sort accounts"
                  options={userSortOptions}
                  value={sort}
                  onChange={(next) => setParams({ sort: next === "newest" ? null : next, page: null })}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={manageUsersPage.icon} text={manageUsersMessages.noMatches}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setParams({ q: null, view: null, page: null });
                  }}
                >
                  {manageUsersMessages.clear}
                </Button>
              </EmptyState>
            ) : (
              <ul className="admin-list admin-list-users" ref={listRef}>
                <li className="admin-list-head" aria-hidden="true">
                  <span>Account</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Joined</span>
                  <span />
                </li>
                {pageUsers.map((user) => {
                  const own = events.filter((event) => event.organiserId === user.userId && event.status !== "draft").length;
                  return (
                    <li className={`admin-row ${openId === user.userId ? "is-open" : ""}`} key={user.userId}>
                      <div className="admin-row-main">
                        <Avatar user={user} />
                        <div className="admin-row-text">
                          <button className="admin-row-open" type="button" onClick={() => openPanel(user.userId)}>
                            {user.username}
                            {user.userId === currentUserId && ` ${manageUsersPage.you}`}
                          </button>
                          <span className="admin-row-sub">{user.email}</span>
                        </div>
                      </div>
                      <span className="admin-row-cell admin-row-hide">{roleLabels[user.role] ?? user.role}</span>
                      <span className="admin-row-status">
                        <StatusBadges user={user} />
                      </span>
                      <span className="admin-row-cell admin-row-meta">
                        {joinedFormatter.format(new Date(user.createdAt))}
                        <span className="admin-row-sub">
                          {suspensionText(user) || (user.role === "organiser" ? manageUsersPage.eventsCount(own) : "")}
                        </span>
                      </span>
                      <span className="admin-row-action" aria-hidden="true">
                        <span className="admin-row-cue">{manageUsersPage.manage}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={(next) => {
                setParams({ page: next > 1 ? String(next) : null });
                listRef.current?.scrollIntoView({ block: "start" });
              }}
              summary={manageUsersPage.paging(firstIndex + 1, firstIndex + pageUsers.length, filtered.length)}
            />
          </>
        )}

        <SidePanel
          open={Boolean(openUser)}
          title={userPanel.title}
          titleId="user-panel-title"
          onClose={closePanel}
          footer={panelFooter}
        >
          {openUser && (
            <div className="admin-review">
              <div className="admin-account-head">
                <Avatar user={openUser} large />
                <div>
                  <h3 className="admin-review-name">
                    {openUser.username}
                    {facts.isSelf && ` ${manageUsersPage.you}`}
                  </h3>
                  <p className="admin-hint">{openUser.email}</p>
                  <div className="admin-review-badges">
                    <StatusBadges user={openUser} />
                  </div>
                </div>
              </div>

              <ul className="event-details-facts">
                <li className="event-details-fact">
                  <Shield aria-hidden="true" />
                  <p>
                    <strong>{roleLabels[openUser.role] ?? openUser.role}</strong>
                    {manageUsersPage.joined} {joinedFormatter.format(new Date(openUser.createdAt))}
                  </p>
                </li>
                <li className="event-details-fact">
                  {openUser.emailVerifiedAt ? <MailCheck aria-hidden="true" /> : <MailWarning aria-hidden="true" />}
                  <p>
                    <strong>{openUser.emailVerifiedAt ? userPanel.verified.title : userPanel.unverified.title}</strong>
                    {openUser.emailVerifiedAt ? userPanel.verified.text : userPanel.unverified.text}
                  </p>
                </li>
                {openUser.role === "organiser" && (
                  <li className="event-details-fact">
                    <CalendarCheck aria-hidden="true" />
                    <p>
                      <strong>{userPanel.events(facts.count)}</strong>
                      {facts.count === 0 ? userPanel.eventsNone : facts.hasPublic ? userPanel.eventsPublic : ""}
                    </p>
                  </li>
                )}
              </ul>

              {openUser.accStatus === "suspended" && openUser.suspensionReason && (
                <p className="admin-note">
                  <strong>{suspensionText(openUser)}</strong>
                  {openUser.suspensionReason}
                </p>
              )}

              <AccountForm
                user={openUser}
                isSelf={facts.isSelf}
                form={panelForm}
                onChange={(changes) => {
                  setForm({ ...panelForm, ...changes });
                  setReasonError("");
                }}
                reasonError={reasonError}
              />
            </div>
          )}
        </SidePanel>
      </section>
    </div>
  );
}
