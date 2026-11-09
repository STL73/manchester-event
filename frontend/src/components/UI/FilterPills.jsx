// Pills that filter a list, one selected, each with its count (without one, a plain
// pill). `attention` marks what needs doing, `tone: "danger"` bad news
export default function FilterPills({ label, options, value, onChange, children }) {
  return (
    <div className="events-when" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          className={`pill events-when-option ${value === option.value ? "is-active" : ""} ${option.attention ? "is-attention" : ""} ${option.tone === "danger" ? "is-danger" : ""}`}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          {option.label}
          {option.count != null && (
            <>
              {" "}
              <span className="events-when-count">{option.count}</span>
            </>
          )}
        </button>
      ))}
      {children}
    </div>
  );
}
