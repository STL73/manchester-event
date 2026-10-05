import { Zap } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import {
  contactMessagesActions,
  contactMessagesInsight,
  contactMessagesSection,
  contactMessagesText,
} from "../data/contactMessagesData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Admin page from contact_messages.php. Messages come from App state, so
// ones sent through the public Contact form appear here straight away.
export default function ContactMessages({ contactMessages }) {
  const SectionIcon = contactMessagesSection.icon;
  // Matches get_all_contact_messages(): newest first
  const messages = [...contactMessages].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt),
  );

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
          {contactMessagesActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="contact-count-title"
      >
        <h2 className="sr-only" id="contact-count-title">
          {contactMessagesInsight.title}
        </h2>
        <div className="dashboard-grid">
          <DashboardCard
            item={{ ...contactMessagesInsight, count: messages.length }}
          />
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="contact-messages-title"
      >
        <h2 className="dashboard-title" id="contact-messages-title">
          <SectionIcon className="dashboard-title-icon" aria-hidden="true" />
          {contactMessagesSection.title}
        </h2>

        {messages.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{contactMessagesText.noMessages}</p>
          </div>
        ) : (
          <ul className="notification-list">
            {messages.map((message) => (
              <li className="notification-card contact-message-card" key={message.messageId}>
                <div className="notification-header">
                  <SectionIcon
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
