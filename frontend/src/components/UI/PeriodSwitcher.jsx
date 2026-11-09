// A segmented button group (a chart's range, All / Unread, Approve / Reject).
// `label` names it for screen readers. No Recharts here, to keep it out of the main bundle
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
