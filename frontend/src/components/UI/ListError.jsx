import { useEffect } from "react";
import { X } from "lucide-react";
import StatusMessage from "./StatusMessage";
import { listError } from "../../data/listErrorData";

// Why a list couldn't load or a heart changed back, over whatever page is open.
// onDismiss should keep one identity (useCallback), or each render restarts the timer
export default function ListError({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, listError.shownFor);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <StatusMessage variant="error" className="list-error">
      <div className="flex items-start gap-2">
        <p className="flex-1">{message}</p>
        <button type="button" className="icon-button list-error-close" aria-label={listError.dismiss} onClick={onDismiss}>
          <X aria-hidden="true" />
        </button>
      </div>
    </StatusMessage>
  );
}
