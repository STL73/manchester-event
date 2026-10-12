import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// A panel that slides in from the right over the page (Manage Events and
// Manage Users, decided 2026-10-12). Built on <dialog>: showModal() keeps
// focus inside, Escape closes it, and focus goes back to the row that
// opened it. A click on the dimmed page outside closes it too
export default function SidePanel({ open, title, titleId, onClose, footer, children }) {
  const dialogRef = useRef(null);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape fires "cancel". The page's state closes the panel, never the
  // browser alone: a panel opened from a link (no click first) gets a
  // cancel without a close event, which left the page thinking it was open
  useEffect(() => {
    const dialog = dialogRef.current;
    const handleCancel = (cancelEvent) => {
      cancelEvent.preventDefault();
      onCloseRef.current();
    };
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="side-panel"
      aria-labelledby={titleId}
      onClick={(clickEvent) => {
        if (clickEvent.target === dialogRef.current) onClose();
      }}
    >
      {open && (
        <div className="side-panel-inner">
          <header className="side-panel-head">
            <h2 className="side-panel-title" id={titleId}>
              {title}
            </h2>
            <button className="side-panel-close" type="button" aria-label="Close" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>
          <div className="side-panel-body">{children}</div>
          {footer && <footer className="side-panel-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
