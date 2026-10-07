import { useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import Button from "../components/UI/Button";
import FaqList from "../components/UI/FaqList";
import PageHero from "../components/UI/PageHero";
import StatusMessage from "../components/UI/StatusMessage";
import { contactMessagesText } from "../data/contactMessagesData";
import { contactPageData } from "../data/contactPageData";
import { featuredQuestions } from "../data/faqData";

export default function Contact({ onSendMessage }) {
  const {
    hero,
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
    <div className="contact-page">
      <PageHero
        compact
        eyebrow={hero.eyebrow}
        title={hero.title}
        titleId="contact-title"
        intro={hero.intro}
        image={hero.image}
      />

      <div className="contact-layout">
        <section className="contact-aside" aria-labelledby="quick-answers-title">
          <p className="contact-response-note">
            <Clock aria-hidden="true" />
            {responseNote}
          </p>

          <h2 className="contact-aside-title" id="quick-answers-title">
            {quickAnswers.title}
          </h2>
          <FaqList items={featuredQuestions} />
          <Button to={quickAnswers.seeAll.to} variant="link" size="sm" className="self-start">
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
    </div>
  );
}
