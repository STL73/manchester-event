// Styled tooltip for icon-only buttons. It is visual only (aria-hidden):
// the button's own aria-label already tells screen readers what it does.
// Optional props for longer text (the category descriptions on Preferences):
// `id` so a control can point at it with aria-describedby, which still reads
// hidden text; `align` to open it from the start, centre or end of the
// trigger; `wrap` to let it run over several lines
const alignClasses = {
  start: "tooltip-start",
  center: "tooltip-center",
  end: "",
};

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
