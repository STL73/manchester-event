// Pills that filter a list, each with its count, in Explore's date-pill
// style (My Events, Manage Events, Manage Users). One is selected at a time;
// `attention` marks the one that needs doing (Manage Events' Needs review)
export default function FilterPills({ label, options, value, onChange }) {
  return (
    <div className="events-when" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          className={`events-when-option ${value === option.value ? "is-active" : ""} ${option.attention ? "is-attention" : ""}`}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          {option.label} <span className="events-when-count">{option.count}</span>
        </button>
      ))}
    </div>
  );
}
