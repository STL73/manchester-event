import { useRef } from "react";
import { CalendarDays, X } from "lucide-react";
import { formatShortDay } from "../../lib/formatDates";

// "Pick a date" as a pill: the browser's own calendar from a hidden date input,
// then the day picked. `value` is YYYY-MM-DD or ""; `clearLabel` adds an x
export default function DatePill({ value, onChange, label, min, clearLabel }) {
  const inputRef = useRef(null);

  function openPicker() {
    try {
      inputRef.current.showPicker();
    } catch {
      inputRef.current.focus();
    }
  }

  return (
    <>
      <span className="events-when-date">
        <button
          className={`pill events-when-option ${value ? "is-active" : ""}`}
          type="button"
          aria-pressed={Boolean(value)}
          onClick={openPicker}
        >
          <CalendarDays aria-hidden="true" />
          {value ? formatShortDay(`${value}T00:00:00`) : label}
        </button>
        <input
          ref={inputRef}
          className="events-when-date-input"
          type="date"
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          tabIndex={-1}
          aria-hidden="true"
        />
      </span>
      {clearLabel && value && (
        <button className="icon-button events-when-clear" type="button" aria-label={clearLabel} onClick={() => onChange("")}>
          <X aria-hidden="true" />
        </button>
      )}
    </>
  );
}
