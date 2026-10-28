import { useEffect } from "react";
import { X } from "lucide-react";
import StatusMessage from "../UI/StatusMessage";
import { favouriteError } from "../../data/myFavouritesData";

// Why a heart changed back, over whatever page it was pressed on. Hearts sit
// on cards all over the site, so the message can't live in any one page
export default function FavouriteError({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, favouriteError.shownFor);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <StatusMessage variant="error" className="favourite-error">
      <div className="flex items-start gap-2">
        <p className="flex-1">{message}</p>
        <button type="button" className="icon-button favourite-error-close" aria-label={favouriteError.dismiss} onClick={onDismiss}>
          <X aria-hidden="true" />
        </button>
      </div>
    </StatusMessage>
  );
}
