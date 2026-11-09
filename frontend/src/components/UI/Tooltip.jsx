// Where `align` opens the tooltip from: the trigger's start, centre or end
const alignClasses = {
  start: "tooltip-start",
  center: "tooltip-center",
  end: "",
};

// A tooltip for icon-only buttons, hidden from screen readers (the aria-label
// says it). `id` lets a control point at it with aria-describedby; `wrap` for long text
export default function Tooltip({ text, id, align = "end", wrap = false, children }) {
  const className = ["tooltip", alignClasses[align], wrap && "tooltip-wrap"]
    .filter(Boolean)
    .join(" ");

  return (
    <span className="tooltip-wrapper">
      {children}
      <span className={className} id={id} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
