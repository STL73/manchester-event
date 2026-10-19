import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import Button from "../components/UI/Button";
import FieldError from "../components/UI/FieldError";
import FilterPills from "../components/UI/FilterPills";
import Pagination from "../components/UI/Pagination";
import SidePanel from "../components/UI/SidePanel";
import SortSelect from "../components/UI/SortSelect";
import StatusMessage from "../components/UI/StatusMessage";
import SearchBar from "../components/events/SearchBar";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import { roleLabels } from "../data/manageUsersData";
import {
  contactMessagesPage,
  contactMessagesSummary,
  contactMessagesText,
  messagePanel,
  messageSortOptions,
  messageViews,
} from "../data/contactMessagesData";

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function initials(name) {
  return name.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
}

function matchesView(message, view) {
  if (view === "unread") return !message.readAt;
  if (view === "replied") return Boolean(message.repliedAt);
  if (view === "guests") return !message.userId;
  return true;
}

// "2 unread · newest 26 Sept · 1 replied"
function Summary({ messages }) {
  const text = contactMessagesSummary;
  if (messages.length === 0) return text.none;
  const unread = messages.filter((message) => !message.readAt).length;
  const replied = messages.filter((message) => message.repliedAt).length;

  return (
    <>
      {unread > 0 ? (
        <>
          <strong>{unread}</strong> {text.unread}
        </>
      ) : (
        text.allRead
      )}
      <span aria-hidden="true"> · </span>
      {text.newest} {shortDateFormatter.format(new Date(messages[0].sentAt))}
      {replied > 0 && (
        <>
          <span aria-hidden="true"> · </span>
          {replied} {text.replied}
        </>
      )}
    </>
  );
}

// Admin page from contact_messages.php (decided 2026-10-12, layout A): the
// messages as a list; one opens in the side panel, which marks it read, as
// opening an email does, and holds the reply. Messages come from App state,
// so ones sent through the public Contact form appear here straight away
export default function ContactMessages({ contactMessages, users, onSetRead, onReply }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [notice, setNotice] = useState("");
  const listRef = useRef(null);
  const PageIcon = contactMessagesPage.icon;

  // Matches get_all_contact_messages(): newest first
  const messages = useMemo(
    () => [...contactMessages].sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [contactMessages],
  );

  const viewParam = searchParams.get("view");
  const view = messageViews.options.some((option) => option.value === viewParam) ? viewParam : "all";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const openId = Number(searchParams.get("open"));
  const openMessage = messages.find((message) => message.messageId === openId);
  const sender = openMessage?.userId ? users.find((user) => user.userId === openMessage.userId) : null;

  // Opening a message reads it, whether by a click or a link to ?open=, once
  // per opening: Mark as unread closes the panel, and the address still
  // names the message for a moment, which must not read it again
  const readOnOpenRef = useRef(null);
  useEffect(() => {
    if (openId === readOnOpenRef.current) return;
    readOnOpenRef.current = openId;
    if (openMessage && !openMessage.readAt) onSetRead(openMessage.messageId, true);
  }, [openId, openMessage, onSetRead]);

  const filtered = useMemo(() => {
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const list = messages.filter(
      (message) =>
        matchesView(message, view) &&
        (!q || `${message.name} ${message.email} ${message.message}`.toLowerCase().includes(q)),
    );
    return sort === "oldest" ? [...list].reverse() : list;
  }, [messages, searchParams, view, sort]);

  const { pageSize } = contactMessagesPage;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * pageSize;
  const pageMessages = filtered.slice(firstIndex, firstIndex + pageSize);

  function setParams(changes) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  }

  function openPanel(messageId) {
    setReply("");
    setReplyError("");
    setNotice("");
    setParams({ open: messageId });
  }

  function closePanel() {
    setParams({ open: null });
  }

  function handleReply() {
    if (!reply.trim()) {
      setReplyError(messagePanel.replyRequired);
      document.getElementById("message-reply")?.focus();
      return;
    }
    onReply(openMessage.messageId, reply.trim());
    setReply("");
    setNotice(contactMessagesText.replySent);
  }

  // Closes the panel first, or opening it would read the message again
  function handleMarkUnread() {
    const { messageId } = openMessage;
    closePanel();
    onSetRead(messageId, false);
    setNotice(contactMessagesText.markedUnread);
  }

  const counts = Object.fromEntries(
    messageViews.options.map((option) => [option.value, messages.filter((message) => matchesView(message, option.value)).length]),
  );

  const panelFooter = openMessage ? (
    <>
      {!openMessage.repliedAt && (
        <Button type="button" variant="primary" size="md" onClick={handleReply}>
          <messagePanel.send.icon aria-hidden="true" />
          {messagePanel.send.label}
        </Button>
      )}
      <Button type="button" variant="secondary" size="md" onClick={handleMarkUnread}>
        <messagePanel.markUnread.icon aria-hidden="true" />
        {messagePanel.markUnread.label}
      </Button>
    </>
  ) : null;

  return (
    <div className="dashboard-page">
      <section className="dashboard-section" aria-labelledby="contact-messages-title">
        <DashboardPageHeading
          id="contact-messages-title"
          icon={PageIcon}
          title={contactMessagesPage.title}
          summary={<Summary messages={messages} />}
        />

        {notice && !openMessage && <StatusMessage className="table-message">{notice}</StatusMessage>}

        {messages.length === 0 ? (
          <EmptyState icon={PageIcon} text={contactMessagesText.noMessages} />
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
              placeholder={contactMessagesPage.searchPlaceholder}
              className="events-search-keywords-only"
            />
            <div className="events-when-row">
              <FilterPills
                label={messageViews.label}
                options={messageViews.options.map((option) => ({ ...option, count: counts[option.value] }))}
                value={view}
                onChange={(next) => setParams({ view: next === "all" ? null : next, page: null })}
              />
              <div className="events-when-tools">
                <SortSelect
                  label="Sort messages"
                  options={messageSortOptions}
                  value={sort}
                  onChange={(next) => setParams({ sort: next === "newest" ? null : next, page: null })}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={PageIcon} text={contactMessagesText.noMatches}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setParams({ q: null, view: null, page: null });
                  }}
                >
                  {contactMessagesText.clear}
                </Button>
              </EmptyState>
            ) : (
              <ul className="admin-list admin-list-messages" ref={listRef}>
                {pageMessages.map((message) => (
                  <li
                    className={`admin-row message-row ${message.readAt ? "" : "is-unread"} ${openId === message.messageId ? "is-open" : ""}`}
                    key={message.messageId}
                  >
                    <span className="message-dot" aria-hidden="true" />
                    <div className="admin-row-text">
                      <button className="admin-row-open" type="button" onClick={() => openPanel(message.messageId)}>
                        {!message.readAt && <span className="sr-only">{contactMessagesPage.unreadLabel}: </span>}
                        {message.name}
                      </button>
                      <span className="admin-row-sub">{message.email}</span>
                    </div>
                    <span className="message-snippet">{message.message.split("\n")[0]}</span>
                    <span className="message-meta">
                      {message.repliedAt && <span className="badge tone-success">{contactMessagesPage.replied}</span>}
                      {!message.userId && <span className="badge tone-accent">{contactMessagesPage.guest}</span>}
                      <time dateTime={message.sentAt}>{shortDateFormatter.format(new Date(message.sentAt))}</time>
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
              summary={contactMessagesPage.paging(firstIndex + 1, firstIndex + pageMessages.length, filtered.length)}
            />
          </>
        )}

        <SidePanel
          open={Boolean(openMessage)}
          title={messagePanel.title}
          titleId="message-panel-title"
          onClose={closePanel}
          footer={panelFooter}
        >
          {openMessage && (
            <div className="admin-review">
              <div className="admin-account-head">
                <span className="admin-avatar" aria-hidden="true">
                  {initials(openMessage.name)}
                </span>
                <div>
                  <h3 className="admin-review-name">{openMessage.name}</h3>
                  <p className="admin-hint">
                    <a className="log-entry-link" href={`mailto:${openMessage.email}`}>
                      {openMessage.email}
                    </a>
                    {" · "}
                    {sender ? (
                      <Link className="log-entry-link" to={`/dashboard/manage-users?open=${sender.userId}`}>
                        {messagePanel.account(roleLabels[sender.role] ?? sender.role, shortDateFormatter.format(new Date(sender.createdAt)))}
                      </Link>
                    ) : (
                      messagePanel.guestNote
                    )}
                  </p>
                </div>
              </div>
              <p className="admin-hint">
                {messagePanel.sent} {fullDateFormatter.format(new Date(openMessage.sentAt))}
              </p>
              <p className="message-body">{openMessage.message}</p>

              {notice && <StatusMessage>{notice}</StatusMessage>}

              {openMessage.repliedAt ? (
                <div className="callout callout-compact tone-success message-reply">
                  <p className="message-reply-title">
                    <Check aria-hidden="true" />
                    {messagePanel.repliedOn(shortDateFormatter.format(new Date(openMessage.repliedAt)))}
                  </p>
                  <p className="message-body-plain">{openMessage.replyBody}</p>
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="message-reply">{messagePanel.replyLabel(openMessage.name)}</label>
                  <textarea
                    id="message-reply"
                    rows="5"
                    placeholder={messagePanel.replyPlaceholder(openMessage.email)}
                    value={reply}
                    aria-invalid={Boolean(replyError)}
                    aria-describedby={replyError ? "message-reply-error" : undefined}
                    onChange={(changeEvent) => {
                      setReply(changeEvent.target.value);
                      setReplyError("");
                    }}
                  />
                  {replyError && <FieldError id="message-reply-error">{replyError}</FieldError>}
                </div>
              )}
            </div>
          )}
        </SidePanel>
      </section>
    </div>
  );
}
