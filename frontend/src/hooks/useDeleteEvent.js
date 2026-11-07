import { useState } from "react";
import { useLocation } from "react-router-dom";

// An organiser's page that deletes from its cards (My Events, My Drafts,
// Organiser Home): the message over the cards, and the delete itself. The
// card has already asked (see EventCard). The server may refuse: an event
// approved since the page loaded can only be cancelled
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
