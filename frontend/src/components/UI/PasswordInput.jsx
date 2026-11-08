import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordForm } from "../../data/profileSettingsData";

// A password field with a show/hide eye inside it. Pass the input's own
// props (id, value, onChange, autoComplete, aria-*). The eye is named for
// screen readers ("Show password"); FormField draws one for type="password"
export default function PasswordInput({ showLabel = passwordForm.show, hideLabel = passwordForm.hide, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="password-input">
      <input {...inputProps} type={visible ? "text" : "password"} />
      <button
        className="icon-button password-input-toggle"
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon aria-hidden="true" />
      </button>
    </div>
  );
}
