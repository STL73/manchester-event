import { useState } from "react";
import { ArrowRight, Clock, Lock } from "lucide-react";
import Button from "../components/UI/Button";
import FaqList from "../components/UI/FaqList";
import PageFrame from "../components/UI/PageFrame";
import StatusMessage from "../components/UI/StatusMessage";
import { contactMessagesText } from "../data/contactMessagesData";
import { contactPageData } from "../data/contactPageData";
import { featuredQuestions } from "../data/faqData";

// `account` ({ name, email }) is the signed-in person inside the dashboard:
// those two fields show locked and are sent from the account
export default function Contact({ onSendMessage, inDashboard = false, account }) {
  const {
    hero,
    dashboardHeading,
    responseNote,
    quickAnswers,
    contactDetails,
    form,
    actions,
  } = contactPageData;

  const [status, setStatus] = useState(null);

  // Matches contact_contr.inc.php: all three fields are required
  function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const name = account?.name ?? String(data.get("name") ?? "").trim();
    const email = account?.email ?? String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setStatus("error");
      return;
    }

    onSendMessage({ name, email, message });
    formElement.reset();
    setStatus("sent");
  }

  return (
    <PageFrame
      inDashboard={inDashboard}
      hero={hero}
      heading={dashboardHeading}
      titleId="contact-title"
      image={hero.image}
      compact
      className="contact-page"
    >

      <div className="contact-layout">
        <section className="panel contact-aside" aria-labelledby="quick-answers-title">
          <p className="contact-response-note">
            <Clock aria-hidden="true" />
            {responseNote}
          </p>

          <h2 className="heading-panel" id="quick-answers-title">
            {quickAnswers.title}
          </h2>
          <FaqList items={featuredQuestions} />
          <Button
            to={inDashboard ? quickAnswers.seeAll.dashboardTo : quickAnswers.seeAll.to}
            variant="link"
            size="sm"
            className="self-start"
          >
            {quickAnswers.seeAll.label}
            <ArrowRight aria-hidden="true" />
          </Button>

          <ul className="contact-details">
            {contactDetails.map(({ label, value, icon: Icon, href }) => (
              <li key={label}>
                <Icon className="content-icon" aria-hidden="true" />
                <span className="sr-only">{label}: </span>
                {href ? <a href={href}>{value}</a> : value}
              </li>
            ))}
          </ul>
        </section>

        <div className="panel contact-form-container">
          <form className="contact-form" onSubmit={handleSubmit}>
            <h2 className="heading-panel contact-form-title">{form.title}</h2>

            {status && (
              <StatusMessage variant={status === "sent" ? "success" : "error"}>
                {status === "sent" ? contactMessagesText.sent : contactMessagesText.error}
              </StatusMessage>
            )}

            {form.fields.map((field) =>
              account && form.accountFields.includes(field.id) ? (
                <div className="field" key={field.id}>
                  <span className="field-label">{field.label}</span>
                  <p className="settings-locked">
                    <Lock aria-hidden="true" />
                    <span className="settings-locked-value">{account[field.id]}</span>
                  </p>
                  {field.id === form.accountFields.at(-1) && (
                    <p className="field-hint">{form.accountHint}</p>
                  )}
                </div>
              ) : (
                <div className="field" key={field.id}>
                  <label htmlFor={field.id}>{field.label}: *</label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      name={field.id}
                      rows="4"
                      placeholder={field.placeholder}
                      required
                    />
                  ) : (
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      required
                    />
                  )}
                </div>
              ),
            )}

            <div className="w-full flex flex-wrap items-center justify-start gap-4">
              <Button type="submit" variant="primary" size="md">
                <actions.submit.icon aria-hidden="true" />
                {actions.submit.label}
              </Button>
              <Button
                type="reset"
                variant="secondary"
                size="md"
                onClick={() => setStatus(null)}
              >
                <actions.reset.icon aria-hidden="true" />
                {actions.reset.label}
              </Button>
            </div>

            <p className="field-hint">All fields with * are required.</p>
          </form>
        </div>
      </div>
    </PageFrame>
  );
}
