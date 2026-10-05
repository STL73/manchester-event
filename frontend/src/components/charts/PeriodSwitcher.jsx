// Segmented button group for a chart header: the time range, or which metric
// the chart shows. `options` come from the page's data file; `label` names the
// group for screen readers (the buttons' own text says enough on screen).
export default function PeriodSwitcher({ label, options, value, onChange }) {
  return (
    <div className="period-switcher" role="group" aria-label={label}>
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
