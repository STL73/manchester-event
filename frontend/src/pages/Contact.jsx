import { useState } from "react";
import Button from "../components/UI/Button";
import { contactMessagesText } from "../data/contactMessagesData";
import { contactPageData } from "../data/contactPageData";

export default function Contact({ onSendMessage }) {
  const {
    title,
    image,
    intro,
    form,
    contactDetails,
    socialLinks,
    responseNote,
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
    <main>
      <section className="section-content" aria-labelledby="contact-title">
        <div className="content-img-container about-image-container">
          <img className="content-img" src={image.src} alt={image.alt} />
        </div>

        <h1 className="section-title" id="contact-title">
          {title}
        </h1>

        <div className="content-wrapper contact-content">
          <p className="content-p">{intro}</p>

          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit}>
              <h2 className="contact-form-title">{form.title}</h2>
              <p className="content-p">{form.description}</p>

              {status && (
                <div
                  className={status === "sent" ? "success-message" : "error-message"}
                  role="status"
                >
                  <p>
                    {status === "sent"
                      ? contactMessagesText.sent
                      : contactMessagesText.error}
                  </p>
                </div>
              )}

              {form.fields.map((field) => (
                <div className="contact-field" key={field.id}>
                  <label htmlFor={field.id}>{field.label}: *</label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      name={field.id}
                      rows="5"
                      placeholder={field.placeholder}
                      required
                    />
                  ) : (
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
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

              <p className="content-p">All fields with * are required.</p>
            </form>
          </div>

          <ul className="contact-details">
            {contactDetails.map(({ label, value, icon: Icon, href }) => (
              <li key={label}>
                <Icon className="content-icon" aria-hidden="true" />
                <span>{label}: </span>
                {href ? <a href={href}>{value}</a> : value}
              </li>
            ))}
          </ul>

          <p className="content-p">
            You can also connect with us via our social media channels:
          </p>
          <div className="about-social-links" aria-label="Social media links">
            {socialLinks.map(({ label, icon: Icon, href }) => (
              <a className="about-social-link" href={href} aria-label={label} key={label}>
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>

          <p className="content-p">{responseNote}</p>
        </div>
      </section>
    </main>
  );
}
