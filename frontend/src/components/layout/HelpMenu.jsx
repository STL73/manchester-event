import { ChevronUp, CircleHelp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

// One "Help" row that opens its links above it (beside it on the icon rail).
// A full group cost 170px and made the sidebar scroll on a laptop screen.
// A disclosure (button + links), not an ARIA menu: these are page links
export default function HelpMenu({ title, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  // A click anywhere else shuts it
  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleKeyDown(event) {
    if (event.key !== "Escape" || !isOpen) return;
    // Only the panel shuts; the phone drawer it sits in stays open
    event.stopPropagation();
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  // Tabbing out of it shuts it too
  function handleBlur(event) {
    if (!wrapperRef.current?.contains(event.relatedTarget)) setIsOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className={`sidebar-help ${isOpen ? "is-open" : ""}`}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        className="sidebar-link"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <div className="menu-item">
          <CircleHelp className="menu-icon" aria-hidden="true" />
          <span className="menu-label">{title}</span>
          <ChevronUp className="sidebar-help-chevron" aria-hidden="true" />
        </div>
      </button>
      <div
        id={panelId}
        className="sidebar-help-panel"
        hidden={!isOpen}
        onClick={() => setIsOpen(false)}
      >
        {items.map((item) => (
          <Link key={item.url} to={item.url} className="sidebar-help-link">
            <item.icon className="sidebar-help-icon" aria-hidden="true" />
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
