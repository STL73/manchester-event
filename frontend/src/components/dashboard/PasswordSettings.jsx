import { useState } from "react";
import { Circle, CircleCheck, CircleX } from "lucide-react";
import Button from "../UI/Button";
import PasswordInput from "../UI/PasswordInput";
import { passwordForm } from "../../data/profileSettingsData";

const emptyPasswords = { current: "", next: "", confirm: "" };

// A rule under a field: grey before typing, then green or red, always with
// its icon so it isn't shown by colour alone
function PasswordRule({ id, met, touched, children }) {
  const Icon = !touched ? Circle : met ? CircleCheck : CircleX;
  const tone = !touched ? "" : met ? "is-met" : "is-unmet";

  return (
    <p className={`settings-rule ${tone}`} id={id}>
      <Icon aria-hidden="true" />
      {children}
    </p>
  );
}

// Change password: the button only works once the current password is in and
// the new one is long enough and typed twice the same. Until the API exists
// the current password isn't checked against anything
export default function PasswordSettings({ email, onChange }) {
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [saved, setSaved] = useState(false);
  // Bumped after a change so the fields start again hidden, not left showing
  const [round, setRound] = useState(0);
  const { current, next, confirm } = passwords;
  const longEnough = next.length >= passwordForm.minLength;
  const matches = confirm !== "" && next === confirm;
  const ready = current !== "" && longEnough && matches;
  const SubmitIcon = passwordForm.submit.icon;

  function update(event) {
    const { name, value } = event.target;
    setPasswords((currentPasswords) => ({ ...currentPasswords, [name]: value }));
    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;
    onChange();
    setPasswords(emptyPasswords);
    setRound((currentRound) => currentRound + 1);
    setSaved(true);
  }

  const shared = { showLabel: passwordForm.show, hideLabel: passwordForm.hide, onChange: update };

  return (
    <form className="settings-form" onSubmit={handleSubmit} noValidate key={round}>
      {/* Lets a password manager tell which account the new password is for */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />

      <div className="field">
        <label htmlFor="current-password">{passwordForm.current}</label>
        <PasswordInput {...shared} id="current-password" name="current" autoComplete="current-password" value={current} />
      </div>

      <div className="settings-two">
        <div className="field">
          <label htmlFor="new-password">{passwordForm.next}</label>
          <PasswordInput
            {...shared}
            id="new-password"
            name="next"
            autoComplete="new-password"
            value={next}
            aria-describedby="new-password-rule"
            aria-invalid={next !== "" && !longEnough}
          />
          <PasswordRule id="new-password-rule" met={longEnough} touched={next !== ""}>
            {passwordForm.lengthRule}
          </PasswordRule>
        </div>
        <div className="field">
          <label htmlFor="confirm-password">{passwordForm.confirm}</label>
          <PasswordInput
            {...shared}
            id="confirm-password"
            name="confirm"
            autoComplete="new-password"
            value={confirm}
            aria-describedby="confirm-password-rule"
            aria-invalid={confirm !== "" && !matches}
          />
          <PasswordRule id="confirm-password-rule" met={matches} touched={confirm !== ""}>
            {passwordForm.matchRule}
          </PasswordRule>
        </div>
      </div>

      <div className="settings-foot">
        {saved && (
          <p className="settings-saved" role="status">
            <CircleCheck aria-hidden="true" />
            {passwordForm.saved}
          </p>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={!ready}>
          <SubmitIcon aria-hidden="true" />
          {passwordForm.submit.label}
        </Button>
      </div>
    </form>
  );
}
