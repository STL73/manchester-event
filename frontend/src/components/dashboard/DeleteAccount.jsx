import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../UI/Button";
import PasswordInput from "../UI/PasswordInput";
import { deleteAccountCopy, passwordForm } from "../../data/profileSettingsData";

// Delete account, confirmed in the page rather than a browser dialog: what
// goes, then the password. An organiser whose events have been public can't
// delete here (people may have them saved), so they get a contact link.
// Until the API exists the password isn't checked
export default function DeleteAccount({ role, hasPublicEvents, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const ButtonIcon = deleteAccountCopy.button.icon;

  if (role === "organiser" && hasPublicEvents) {
    return (
      <p className="field-hint settings-hint settings-blocked">
        {deleteAccountCopy.blocked}{" "}
        <Link className="settings-link" to="/contact">{deleteAccountCopy.contact}</Link>
      </p>
    );
  }

  if (!confirming) {
    return (
      <div className="settings-delete-start">
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          <ButtonIcon aria-hidden="true" />
          {deleteAccountCopy.button.label}
        </Button>
      </div>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (password) onDelete();
  }

  function cancel() {
    setConfirming(false);
    setPassword("");
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
          onChange={(event) => setPassword(event.target.value)}
          showLabel={passwordForm.show}
          hideLabel={passwordForm.hide}
          autoFocus
        />
      </div>
      <div className="settings-confirm-actions">
        <Button variant="ghost" size="sm" onClick={cancel}>
          {deleteAccountCopy.cancel}
        </Button>
        <Button type="submit" variant="destructive" size="sm" disabled={!password}>
          <ButtonIcon aria-hidden="true" />
          {deleteAccountCopy.confirm}
        </Button>
      </div>
    </form>
  );
}
