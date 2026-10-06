import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import Button from "../components/UI/Button";
import StatusMessage from "../components/UI/StatusMessage";
import { contactMessagesText } from "../data/contactMessagesData";
import { contactPageData } from "../data/contactPageData";

export default function Contact({ onSendMessage }) {
  const {
    title,
    intro,
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
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
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
    <section className="section-content contact-page" aria-labelledby="contact-title">
      {/* The heading sits beside the form rather than above it, so the whole
          form, Send button included, fits on a laptop screen */}
      <div className="contact-layout">
        <div className="contact-aside">
          <header className="contact-header">
            <h1 className="contact-title" id="contact-title">
              {title}
            </h1>
            <p className="content-p">{intro}</p>
            <p className="contact-response-note">
              <Clock aria-hidden="true" />
              {responseNote}
            </p>
          </header>

          <h2 className="contact-aside-title" id="quick-answers-title">
            {quickAnswers.title}
          </h2>
          {/* <details> opens and closes without JavaScript and is keyboard
              accessible by default */}
          <div className="faq-list">
            {quickAnswers.items.map(({ question, answer }) => (
              <details className="faq-item" key={question}>
                <summary>
                  {question}
                  <ChevronDown className="faq-icon" aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>

          <ul className="contact-details">
            {contactDetails.map(({ label, value, icon: Icon, href }) => (
              <li key={label}>
                <Icon className="content-icon" aria-hidden="true" />
                <span className="sr-only">{label}: </span>
                {href ? <a href={href}>{value}</a> : value}
              </li>
            ))}
          </ul>
        </div>

        <div className="contact-form-container">
          <form className="contact-form" onSubmit={handleSubmit}>
            <h2 className="contact-form-title">{form.title}</h2>

            {status && (
              <StatusMessage variant={status === "sent" ? "success" : "error"}>
                {status === "sent" ? contactMessagesText.sent : contactMessagesText.error}
              </StatusMessage>
            )}

            {form.fields.map((field) => (
              <div className="contact-field" key={field.id}>
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
            ))}

            <div className="content-btn-box contact-actions">
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
    </section>
  );
}
