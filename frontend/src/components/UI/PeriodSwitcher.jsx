// Segmented button group: a chart's time range or metric, Notifications'
// All / Unread, and the admin panels' choices (Approve / Reject, Active /
// Suspended). It imports nothing from Recharts, so the pages outside
// analytics don't pull charts into the main bundle.
// `options` come from the page's data file; `label` names the group for
// screen readers (the buttons' own text says enough on screen).
export default function PeriodSwitcher({ label, options, value, onChange, className = "" }) {
  return (
    <div className={`period-switcher ${className}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
