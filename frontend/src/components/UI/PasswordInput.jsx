import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// A password field with a show/hide eye inside it. Pass the input's own
// props (id, value, onChange, autoComplete, aria-*); `showLabel` and
// `hideLabel` name the eye for screen readers. Sign-up and login can use it
// when they are rebuilt
export default function PasswordInput({ showLabel, hideLabel, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="password-input">
      <input {...inputProps} type={visible ? "text" : "password"} />
      <button
        className="password-input-toggle"
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
