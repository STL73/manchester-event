import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// A panel that slides in from the right, on <dialog>: focus stays inside and
// goes back to the row after; Escape or a click outside closes it
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

  // Escape's "cancel" closes it through the page's state, never the browser's own
  // close, which can arrive late and shut the next item opened
  useEffect(() => {
    const dialog = dialogRef.current;
    const handleCancel = (cancelEvent) => {
      cancelEvent.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
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
        <div className="flex h-full flex-col">
          <header className="side-panel-head">
            <h2 className="side-panel-title" id={titleId}>
              {title}
            </h2>
            <button className="icon-button size-9" type="button" aria-label="Close" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <footer className="side-panel-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
