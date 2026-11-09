import { CircleCheck } from "lucide-react";
import FieldError from "./FieldError";
import PasswordInput from "./PasswordInput";

// One labelled form control with an optional hint and error, both linked by
// aria-describedby so screen readers announce them. A password gets the eye
export default function FormField({
  id,
  label,
  // On the label row, but not read as the description (Log in's "Forgot password?")
  action,
  type = "text",
  options = [],
  placeholder,
  hint,
  error,
  ...props
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const hintText = hint && (
    <span className="field-hint" id={hintId}>
      {hint}
    </span>
  );

  const errorText = error && <FieldError id={errorId}>{error}</FieldError>;

  // A few choices read better as cards than hidden in a dropdown. A fieldset
  // groups them under one name; the legend must be its first child to name
  // the group, so the legend is the label row itself
  if (type === "radio") {
    return (
      <fieldset className="field" aria-describedby={describedBy}>
        <legend className="field-label w-full flex items-baseline justify-between gap-3">
          <span>{label}</span>
          {hintText}
        </legend>
        <div className="grid grid-cols-2 gap-6">
          {options.map((option) => (
            <label className="radio-card" key={option.value}>
              <input
                type="radio"
                className="radio-card-input"
                name={id}
                value={option.value}
                aria-invalid={error ? true : undefined}
                {...props}
              />
              <span className="radio-card-label">{option.label}</span>
              {option.description && (
                <span className="radio-card-description">{option.description}</span>
              )}
              <CircleCheck className="radio-card-check" aria-hidden="true" />
            </label>
          ))}
        </div>
        {errorText}
      </fieldset>
    );
  }

  const controlProps = {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    ...props,
  };

  return (
    <div className="field">
      {/* Label on the left, short hint or action on the right: they cost no height */}
      <div className="w-full flex items-baseline justify-between gap-3">
        <label htmlFor={id}>{label}</label>
        {hintText}
        {action}
      </div>

      {type === "select" ? (
        // An uncontrolled select starts on its placeholder; a controlled one
        // (a `value` passed) can't also take a defaultValue
        <select {...("value" in props ? {} : { defaultValue: "" })} {...controlProps}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "password" ? (
        <PasswordInput placeholder={placeholder} {...controlProps} />
      ) : type === "textarea" ? (
        <textarea rows="5" placeholder={placeholder} {...controlProps} />
      ) : (
        <input type={type} placeholder={placeholder} {...controlProps} />
      )}

      {errorText}
    </div>
  );
}
