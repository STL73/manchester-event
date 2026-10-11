// An on/off switch (role="switch"). On takes the accent tint, like other
// selected options; it is not an action, so never solid accent
export default function Switch({ checked, onChange, label, id, describedBy }) {
  return (
    <button
      className="switch"
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
    />
  );
}
