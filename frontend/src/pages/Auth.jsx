import { useState } from "react";
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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

// Errors in the order the fields appear, so the first one gets focus. Each
// field is checked only on the pages that have it. Login only checks that
// the password is filled in: telling someone the password rules on a login
// form would hint at what a valid password looks like.
function validate(values) {
  // Sign-up and reset choose a password; they have a confirmation field
  const isNewPassword = "confirmPassword" in values;
  // Sign-up is told by its name field: an unchosen role isn't in the form data at all
  const isSignUp = "username" in values;
  const errors = {};

  if (isSignUp && !values.username) errors.username = authErrors.usernameRequired;

  if ("email" in values) {
    if (!values.email) errors.email = authErrors.emailRequired;
    else if (!EMAIL_PATTERN.test(values.email)) errors.email = authErrors.emailInvalid;
  }

  if ("password" in values) {
    if (!values.password) errors.password = authErrors.passwordRequired;
    else if (isNewPassword && values.password.length < PASSWORD_MIN_LENGTH) {
      errors.password = authErrors.passwordTooShort;
    }
  }

  if (isNewPassword && values.confirmPassword !== values.password) {
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

function AuthForm({ page, token, onAccountChange }) {
  const { title, subtitle, image, caption, fields, forgotLink, submit, switchPrompt, endpoint } = page;
  const navigate = useNavigate();
  // A message passed on from the page before (Log in, after a reset)
  const notice = useLocation().state?.notice;
  const [errors, setErrors] = useState({});
  const linkBroken = page.needsToken && !token;
  // A problem that isn't one field's: a wrong email or password, an expired link, no connection
  const [formError, setFormError] = useState(linkBroken ? page.missingToken : "");
  const [sending, setSending] = useState(false);
  // Forgot password: the address a link was asked for, shown in the reply
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readValues(form);
    setFormError("");
    setSentTo("");
    if (showErrors(form, validate(values), setErrors)) return;

    // confirmPassword is only checked here; the API doesn't take it
    const body = Object.fromEntries(Object.entries(values).filter(([name]) => name !== "confirmPassword"));
    if (page.needsToken) body.token = token;
    setSending(true);
    try {
      const response = await api(endpoint, { method: "POST", body });
      if (page.onSuccess === "signedIn") {
        onAccountChange(response.data);
        navigate("/dashboard/home", { replace: true });
      } else if (page.onSuccess === "reset") {
        // The reset ended every session, this browser's too if it had one
        onAccountChange(null);
        navigate("/auth/login", { replace: true, state: { notice: page.done } });
      } else {
        setSending(false);
        setSentTo(values.email);
      }
    } catch (error) {
      setSending(false);
      if (!showErrors(form, fieldErrors(error.details), setErrors)) setFormError(error.message);
    }
  }

  function renderField({ id, ...field }) {
    const hint =
      forgotLink && id === "password" ? (
        <Button to={forgotLink.to} variant="link" size="sm">
          {forgotLink.label}
        </Button>
      ) : (
        field.hint
      );
    return <FormField key={id} id={id} error={errors[id]} {...field} hint={hint} />;
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
        {notice && !formError && <StatusMessage>{notice}</StatusMessage>}
        {sentTo && (
          <StatusMessage>
            {page.sent(sentTo).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </StatusMessage>
        )}

        {fields.map((row) =>
          Array.isArray(row) ? (
            <div className="profile-form-grid" key={row.map(({ id }) => id).join("-")}>
              {row.map(renderField)}
            </div>
          ) : (
            renderField(row)
          ),
        )}

        <Button type="submit" className="w-full" disabled={sending || linkBroken}>
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

export default function Auth({ isUser, onAccountChange }) {
  const { pathname } = useParams();
  const [searchParams] = useSearchParams();
  const page = authPageData[pathname];

  // Already logged in: nothing to do here. A reset link still works, as it
  // may be opened where someone else is logged in
  if (isUser && pathname !== "reset-password") return <Navigate to="/dashboard/home" replace />;

  // Old or mistyped links (/auth/sign-in, /auth/signup...) land on the login form
  if (!page) return <Navigate to="/auth/login" replace />;

  // A section, not a <main>: App already wraps every page in one
  return (
    <section className="section-content auth-section">
      {/* The honeycomb sits on the empty space around the card, so phones,
          where the photo is hidden, get it too */}
      <div className="honeycomb-texture auth-texture" aria-hidden="true" />
      {/* key: switching between login and sign-up starts a fresh form */}
      <AuthForm key={pathname} page={page} token={searchParams.get("token")} onAccountChange={onAccountChange} />
    </section>
  );
}
