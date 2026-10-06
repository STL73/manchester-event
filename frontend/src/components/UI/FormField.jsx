import { CircleCheck } from "lucide-react";
import FieldError from "./FieldError";

// One labelled form control with an optional hint and error, styled by
// .contact-field. The hint and error are linked to the control with
// aria-describedby so screen readers announce them with the field.
// The hint sits on the label row so it costs no extra height.
export default function FormField({
  id,
  label,
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
      <fieldset className="contact-field" aria-describedby={describedBy}>
        <legend className="field-label-row">
          <span>{label}</span>
          {hintText}
        </legend>
        <div className="radio-cards">
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
    <div className="contact-field">
      <div className="field-label-row">
        <label htmlFor={id}>{label}</label>
        {hintText}
      </div>

      {type === "select" ? (
        <select className="form-select" defaultValue="" {...controlProps}>
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
      ) : type === "textarea" ? (
        <textarea rows="5" placeholder={placeholder} {...controlProps} />
      ) : (
        <input type={type} placeholder={placeholder} {...controlProps} />
      )}

      {errorText}
    </div>
  );
}
