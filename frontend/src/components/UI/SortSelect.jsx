import { ArrowDownUp } from "lucide-react";

// A small sort dropdown for the row under a search bar, framed like the
// filter pills beside it (My Events, Manage Events, Manage Users)
export default function SortSelect({ label, options, value, onChange }) {
  return (
    <label className="toolbar-select">
      <span className="sr-only">{label}</span>
      <ArrowDownUp aria-hidden="true" />
      <select value={value} onChange={(changeEvent) => onChange(changeEvent.target.value)}>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
