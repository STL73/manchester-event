import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../UI/Button";
import FieldError from "../UI/FieldError";
import PasswordInput from "../UI/PasswordInput";
import StatusMessage from "../UI/StatusMessage";
import { deleteAccountCopy, passwordForm } from "../../data/profileSettingsData";

// Delete account, confirmed in the page rather than a browser dialog: what
// goes, then the password. An organiser whose events have been public can't
// delete here (people may have them saved): the server says so (409), and
// they get a contact link instead. Their events are real only from Phase 5,
// so the page can't tell before asking
export default function DeleteAccount({ role, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  // { password } for a wrong password, { form } for anything else (a suspension)
  const [error, setError] = useState({});
  const ButtonIcon = deleteAccountCopy.button.icon;

  if (blocked) {
    return (
      <p className="field-hint settings-hint settings-blocked">
        {deleteAccountCopy.blocked}{" "}
        <Link className="settings-link" to="/dashboard/contact">{deleteAccountCopy.contact}</Link>
      </p>
    );
  }

  if (!confirming) {
    return (
      <div className="flex justify-end">
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          <ButtonIcon aria-hidden="true" />
          {deleteAccountCopy.button.label}
        </Button>
      </div>
    );
  }

  // On success the account is gone and App leaves Settings, so only a
  // refusal comes back here
  async function handleSubmit(event) {
    event.preventDefault();
    if (!password || deleting) return;
    setDeleting(true);
    setError({});
    try {
      await onDelete(password);
    } catch (deleteError) {
      setDeleting(false);
      const wrongPassword = deleteError.details?.find(({ path }) => path === "body.password");
      if (deleteError.status === 409) setBlocked(true);
      else setError(wrongPassword ? { password: wrongPassword.message } : { form: deleteError.message });
    }
  }

  function cancel() {
    setConfirming(false);
    setPassword("");
    setError({});
  }

  return (
    <form className="settings-confirm" onSubmit={handleSubmit} noValidate>
      <p className="settings-confirm-title">{deleteAccountCopy.confirmTitle}</p>
      <ul className="settings-confirm-list">
        {(deleteAccountCopy.removes[role] ?? deleteAccountCopy.removes.user).map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>{deleteAccountCopy.permanent}</li>
      </ul>
      <div className="field">
        <label htmlFor="delete-password">{deleteAccountCopy.passwordLabel}</label>
        <PasswordInput
          id="delete-password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError({});
          }}
          showLabel={passwordForm.show}
          hideLabel={passwordForm.hide}
          aria-invalid={error.password ? true : undefined}
          aria-describedby={error.password ? "delete-password-error" : undefined}
          autoFocus
        />
        {error.password && <FieldError id="delete-password-error">{error.password}</FieldError>}
      </div>
      {error.form && (
        <StatusMessage variant="error" className="callout-compact">
          {error.form}
        </StatusMessage>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={cancel}>
          {deleteAccountCopy.cancel}
        </Button>
        <Button type="submit" variant="destructive" size="sm" disabled={!password || deleting}>
          <ButtonIcon aria-hidden="true" />
          {deleteAccountCopy.confirm}
        </Button>
      </div>
    </form>
  );
}
