import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../UI/Button";
import FormField from "../UI/FormField";
import StatusMessage from "../UI/StatusMessage";
import { deleteAccountCopy } from "../../data/profileSettingsData";
import { fieldErrors } from "../../lib/api";

// Delete account, confirmed in the page with the password. An organiser whose
// events have been public learns so from the server (409) and gets a contact link
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
      const wrongPassword = fieldErrors(deleteError).password;
      if (deleteError.status === 409) setBlocked(true);
      else setError(wrongPassword ? { password: wrongPassword } : { form: deleteError.message });
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
      <FormField
        id="delete-password"
        type="password"
        label={deleteAccountCopy.passwordLabel}
        autoComplete="current-password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError({});
        }}
        error={error.password}
        autoFocus
      />
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
