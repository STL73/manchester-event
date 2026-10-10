import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import {
  contactMessagesActions,
  contactMessagesPage,
  contactMessagesSummary,
  contactMessagesText,
} from "../data/contactMessagesData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const summaryDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// "3 messages · 2 unread · newest 26 Sept"; messages arrive newest first
function ContactMessagesSummary({ messages }) {
  const text = contactMessagesSummary;
  if (messages.length === 0) return text.none;

  const unread = messages.filter((message) => !message.readAt).length;
  return (
    <>
      <strong>
        {messages.length} {messages.length === 1 ? text.message : text.messages}
      </strong>
      {unread > 0 && (
        <>
          <span aria-hidden="true"> · </span>
          <strong>
            {unread} {text.unread}
          </strong>
        </>
      )}
      <span aria-hidden="true"> · </span>
      {text.newest} {summaryDateFormatter.format(new Date(messages[0].sentAt))}
    </>
  );
}

// Admin page from contact_messages.php. Messages come from App state, so
// ones sent through the public Contact form appear here straight away.
export default function ContactMessages({ contactMessages }) {
  const PageIcon = contactMessagesPage.icon;
  // Matches get_all_contact_messages(): newest first
  const messages = [...contactMessages].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt),
  );

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="contact-messages-title"
      >
        <DashboardPageHeading
          id="contact-messages-title"
          icon={PageIcon}
          title={contactMessagesPage.title}
          summary={<ContactMessagesSummary messages={messages} />}
          actions={contactMessagesActions}
        />

        {messages.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{contactMessagesText.noMessages}</p>
          </div>
        ) : (
          <ul className="notification-list">
            {messages.map((message) => (
              <li className="notification-card contact-message-card" key={message.messageId}>
                <div className="notification-header">
                  <PageIcon
                    className="notification-status-icon"
                    aria-hidden="true"
                  />
                  <h3 className="notification-subject">
                    {message.name}{" "}
                    <a className="contact-message-email" href={`mailto:${message.email}`}>
                      ({message.email})
                    </a>
                  </h3>
                  {message.userId && (
                    <span className="info-badge">
                      {contactMessagesText.userIdBadge}: {message.userId}
                    </span>
                  )}
                </div>
                <p className="notification-body contact-message-text">
                  {message.message}
                </p>
                <p className="notification-meta">
                  <time dateTime={message.sentAt}>
                    {dateFormatter.format(new Date(message.sentAt))}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
