import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import FormField from "../components/UI/FormField";
import StatusMessage from "../components/UI/StatusMessage";
import { api } from "../lib/api";
import {
  PASSWORD_MIN_LENGTH,
  authErrors,
  authPageData,
  signUpRoles,
} from "../data/authPageData";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Errors in the order the fields appear, so the first one gets focus.
// Login only checks that both fields are filled in: telling someone the
// password rules on a login form would hint at what a valid password looks like.
function validate(values) {
  const isSignUp = "confirmPassword" in values;
  const errors = {};

  if (isSignUp && !values.username) errors.username = authErrors.usernameRequired;

  if (!values.email) errors.email = authErrors.emailRequired;
  else if (!EMAIL_PATTERN.test(values.email)) errors.email = authErrors.emailInvalid;

  if (!values.password) errors.password = authErrors.passwordRequired;
  else if (isSignUp && values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = authErrors.passwordTooShort;
  }

  if (isSignUp && values.confirmPassword !== values.password) {
    errors.confirmPassword = authErrors.passwordsDiffer;
  }

  if (isSignUp && !signUpRoles.includes(values.role)) errors.role = authErrors.roleRequired;

  return errors;
}

// Passwords are kept exactly as typed; everything else is trimmed
function readValues(form) {
  return Object.fromEntries(
    [...new FormData(form)].map(([name, value]) => [
      name,
      name.toLowerCase().includes("password") ? value : value.trim(),
    ]),
  );
}

// Shows each field's error and moves focus to the first. Returns whether there were any
function showErrors(form, errors, setErrors) {
  setErrors(errors);
  const [firstInvalid] = Object.keys(errors);
  if (!firstInvalid) return false;

  // A radio group comes back as a list with no focus() of its own
  const control = form.elements[firstInvalid];
  (control instanceof RadioNodeList ? control[0] : control).focus();
  return true;
}

// The API names a field "body.email"; the form calls it "email"
function fieldErrors(details = []) {
  return Object.fromEntries(details.map(({ path, message }) => [path.replace("body.", ""), message]));
}

function AuthForm({ page, onSignedIn }) {
  const { title, subtitle, image, caption, fields, submit, switchPrompt, endpoint } = page;
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  // A problem that isn't one field's: a wrong email or password, no connection
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readValues(form);
    setFormError("");
    if (showErrors(form, validate(values), setErrors)) return;

    // confirmPassword is only checked here; the API doesn't take it
    const body = Object.fromEntries(Object.entries(values).filter(([name]) => name !== "confirmPassword"));
    setSending(true);
    try {
      const { data } = await api(endpoint, { method: "POST", body });
      onSignedIn(data);
      navigate("/dashboard/home", { replace: true });
    } catch (error) {
      setSending(false);
      if (!showErrors(form, fieldErrors(error.details), setErrors)) setFormError(error.message);
    }
  }

  function renderField({ id, ...field }) {
    return <FormField key={id} id={id} error={errors[id]} {...field} />;
  }

  return (
    <div className="panel auth-card">
      {/* noValidate: the checks below show their messages in the page style,
          instead of the browser's own pop-ups */}
      <form className="contact-form auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-header">
          <h1 className="heading-panel contact-form-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
        </div>

        {/* No error summary: on a form this short, each field shows its own
            error and focus moves to the first one */}
        {formError && <StatusMessage variant="error">{formError}</StatusMessage>}

        {fields.map((row) =>
          Array.isArray(row) ? (
            <div className="profile-form-grid" key={row.map(({ id }) => id).join("-")}>
              {row.map(renderField)}
            </div>
          ) : (
            renderField(row)
          ),
        )}

        <Button type="submit" className="w-full" disabled={sending}>
          <submit.icon aria-hidden="true" />
          {submit.label}
        </Button>

        <p className="auth-switch">
          {switchPrompt.text}{" "}
          <Button to={switchPrompt.to} variant="link" size="sm">
            {switchPrompt.label}
          </Button>
        </p>
      </form>

      {/* The caption is set like the page headers' eyebrow and heading, but
          without their honeycomb: the page's one honeycomb is the backdrop */}
      <div className="auth-media">
        <img className="auth-image" src={image.src} alt={image.alt} />
        <div className="auth-caption">
          <p className="eyebrow">{caption.place}</p>
          <p className="auth-caption-text">{caption.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Auth({ isUser, onSignedIn }) {
  const { pathname } = useParams();
  const page = authPageData[pathname];

  // Already logged in: nothing to do here
  if (isUser) return <Navigate to="/dashboard/home" replace />;

  // Old or mistyped links (/auth/sign-in, /auth/signup...) land on the login form
  if (!page) return <Navigate to="/auth/login" replace />;

  // A section, not a <main>: App already wraps every page in one
  return (
    <section className="section-content auth-section">
      {/* The honeycomb sits on the empty space around the card, so phones,
          where the photo is hidden, get it too */}
      <div className="honeycomb-texture auth-texture" aria-hidden="true" />
      {/* key: switching between login and sign-up starts a fresh form */}
      <AuthForm key={pathname} page={page} onSignedIn={onSignedIn} />
    </section>
  );
}
