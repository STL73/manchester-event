// Styled tooltip for icon-only buttons. It is visual only (aria-hidden):
// the button's own aria-label already tells screen readers what it does.
export default function Tooltip({ text, children }) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className="tooltip" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
