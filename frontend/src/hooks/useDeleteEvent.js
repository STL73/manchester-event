import { useState } from "react";
import { useLocation } from "react-router-dom";

// Deleting from an organiser's cards: the delete and the message over the cards.
// The server may refuse one approved since the page loaded
export function useDeleteEvent(onDeleteEvent, deletedText) {
  // A message can arrive from Create or Edit Event (a new draft, a cancelled event)
  const location = useLocation();
  const [message, setMessage] = useState(() =>
    location.state?.message ? { text: location.state.message } : null,
  );

  async function deleteEvent(event) {
    setMessage(null);
    try {
      await onDeleteEvent(event.eventId);
      setMessage({ text: deletedText });
    } catch (error) {
      setMessage({ text: error.message, variant: "error" });
    }
  }

  return { message, setMessage, deleteEvent };
}
