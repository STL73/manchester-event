import { useState } from "react";
import { ArrowRight, Clock, Lock } from "lucide-react";
import Button from "../components/UI/Button";
import FormField from "../components/UI/FormField";
import FaqList from "../components/UI/FaqList";
import PageFrame from "../components/UI/PageFrame";
import StatusMessage from "../components/UI/StatusMessage";
import { contactMessagesText } from "../data/contactMessagesData";
import { contactPageData } from "../data/contactPageData";
import { featuredQuestions } from "../data/faqData";
import { fieldErrors } from "../lib/api";
import { isEmail } from "../lib/validation";
import { authErrors } from "../data/authPageData";

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
  // The server's refusal: under its field when it names one, otherwise as
  // the message above the form
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Every field is required; signed in, only the message is sent. `website` is
  // the hidden field only bots fill in
  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const name = account?.name ?? String(data.get("name") ?? "").trim();
    const email = account?.email ?? String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const website = String(data.get("website") ?? "");

    // Each problem under its field, the first one focused, as on Log in
    const found = {};
    if (!name) found.name = form.errors.name;
    if (!email) found.email = authErrors.emailRequired;
    else if (!isEmail(email)) found.email = authErrors.emailInvalid;
    if (!message) found.message = form.errors.message;
    setErrors(found);
    const firstProblem = form.fields.find((field) => found[field.id]);
    if (firstProblem) {
      // Nothing was sent, so no "error sending" box: the fields say what's missing
      setStatus(null);
      document.getElementById(firstProblem.id)?.focus();
      return;
    }

    setSending(true);
    try {
      await onSendMessage(account ? { message, website } : { name, email, message, website });
    } catch (error) {
      const refused = fieldErrors(error);
      setErrors(refused);
      setErrorMessage(Object.keys(refused).length > 0 ? contactMessagesText.error : error.message);
      setStatus("error");
      const firstField = form.fields.find((field) => refused[field.id]);
      if (firstField) document.getElementById(firstField.id)?.focus();
      return;
    } finally {
      setSending(false);
    }
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
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <h2 className="heading-panel contact-form-title">{form.title}</h2>

            {status && (
              <StatusMessage variant={status === "sent" ? "success" : "error"}>
                {status === "sent" ? contactMessagesText.sent : errorMessage}
              </StatusMessage>
            )}

            {form.fields.map((field) =>
              account && form.accountFields.includes(field.id) ? (
                // Locked: the account's own value, no input, so not a FormField
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
                <FormField
                  key={field.id}
                  id={field.id}
                  type={field.type}
                  label={`${field.label}: *`}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  rows={field.type === "textarea" ? "4" : undefined}
                  error={errors[field.id]}
                  required
                />
              ),
            )}

            {/* Off-screen and out of the tab order: people never fill it in,
                bots fill in every field, and the server drops what they send */}
            <div className="absolute -left-[100vw] size-px overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-website">{form.honeypotLabel}</label>
              <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="w-full flex flex-wrap items-center justify-start gap-4">
              <Button type="submit" variant="primary" size="md" disabled={sending}>
                <actions.submit.icon aria-hidden="true" />
                {actions.submit.label}
              </Button>
              <Button
                type="reset"
                variant="secondary"
                size="md"
                onClick={() => {
                  setStatus(null);
                  setErrors({});
                }}
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
