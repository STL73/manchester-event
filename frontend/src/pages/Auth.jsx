import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import FormField from "../components/UI/FormField";
import StatusMessage from "../components/UI/StatusMessage";
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

function AuthForm({ page }) {
  const { title, subtitle, image, fields, submit, switchPrompt, success } = page;
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validate(readValues(form));
    const [firstInvalid] = Object.keys(nextErrors);

    setErrors(nextErrors);
    setSubmitted(!firstInvalid);
    if (!firstInvalid) return;

    // A radio group comes back as a list with no focus() of its own
    const control = form.elements[firstInvalid];
    (control instanceof RadioNodeList ? control[0] : control).focus();
  }

  function renderField({ id, ...field }) {
    return <FormField key={id} id={id} error={errors[id]} {...field} />;
  }

  return (
    <div className="auth-card">
      {/* noValidate: the checks below show their messages in the page style,
          instead of the browser's own pop-ups */}
      <form className="contact-form auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-header">
          <h1 className="contact-form-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
        </div>

        {/* No error summary: on a form this short, each field shows its own
            error and focus moves to the first one */}
        {submitted && (
          <StatusMessage>{success}</StatusMessage>
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

        <Button type="submit" className="w-full">
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

      <div className="auth-media">
        <img className="auth-image" src={image.src} alt={image.alt} />
      </div>
    </div>
  );
}

export default function Auth() {
  const { pathname } = useParams();
  const page = authPageData[pathname];

  // Old or mistyped links (/auth/sign-in, /auth/signup...) land on the login form
  if (!page) return <Navigate to="/auth/login" replace />;

  return (
    <main>
      <section className="section-content auth-section">
        {/* key: switching between login and sign-up starts a fresh form */}
        <AuthForm key={pathname} page={page} />
      </section>
    </main>
  );
}
