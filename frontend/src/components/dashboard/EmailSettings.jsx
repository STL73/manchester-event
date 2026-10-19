import { useState } from "react";
import { CircleCheck, ShieldCheck } from "lucide-react";
import Switch from "../UI/Switch";
import { emailSettings } from "../../data/profileSettingsData";

// The one email_notifications switch; its wording depends on the role. It
// saves as soon as it is flipped, so it says so instead of having a button
export default function EmailSettings({ role, enabled, onChange }) {
  const [saved, setSaved] = useState(false);
  const { title, text } = emailSettings.byRole[role] ?? emailSettings.byRole.user;

  function toggle(nextEnabled) {
    onChange(nextEnabled);
    setSaved(true);
  }

  return (
    <div className="settings-form">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="settings-switch-title" id="email-switch-title">{title}</p>
          <p className="field-hint settings-hint" id="email-switch-text">{text}</p>
        </div>
        <Switch checked={enabled} onChange={toggle} label={title} describedBy="email-switch-text" />
      </div>
      <p className="callout callout-compact settings-note">
        <ShieldCheck aria-hidden="true" />
        {emailSettings.always}
      </p>
      <p className="settings-saved" role="status">
        {saved && (
          <>
            <CircleCheck aria-hidden="true" />
            {emailSettings.saved(title, enabled)}
          </>
        )}
      </p>
    </div>
  );
}
