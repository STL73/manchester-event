import { useCallback, useEffect, useState } from "react";
import { api, formWithFile } from "../lib/api";
import { toOrganiserEvent } from "../lib/organiserEvents";
import { replaceById } from "../lib/replaceById";

// An organiser's own events, kept with the account they belong to, and the
// five handlers that change them. organiserEventsLoaded is false until they
// arrive, so Event details can wait rather than say "not found". Each handler
// awaits the server and throws its ApiError for the page to show; the list
// changes only once the server has agreed
export function useOrganiserEvents(account, showError) {
  const organiserUserId = account?.role === "organiser" ? account.userId : null;
  const [organiserLists, setOrganiserLists] = useState({ userId: null, events: null });
  const organiserEventsLoaded = organiserUserId !== null && organiserLists.userId === organiserUserId;
  const organiserEvents = organiserEventsLoaded ? organiserLists.events : [];

  // If the list can't be read the pages show none, with the reason over the page
  useEffect(() => {
    if (organiserUserId === null) return undefined;
    let current = true;
    api("/users/me/events").then(
      ({ data }) =>
        current &&
        setOrganiserLists({ userId: organiserUserId, events: data.map((event) => toOrganiserEvent(event, account)) }),
      (error) => {
        if (!current) return;
        setOrganiserLists({ userId: organiserUserId, events: [] });
        showError(error.message);
      },
    );
    return () => {
      current = false;
    };
    // account is read for the name only; the list follows the account's id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organiserUserId, showError]);

  // Changes the list only while it still belongs to the same account
  const updateOrganiserEvents = useCallback(
    (userId, change) =>
      setOrganiserLists((current) => (current.userId === userId ? { ...current, events: change(current.events) } : current)),
    [],
  );

  // The server decides the status from the event and `submit`, as
  // insert_event() and update_event() did in the PHP. A new photo (a File)
  // goes with the form in the same request
  async function createOrganiserEvent(body, photo) {
    const userId = organiserUserId;
    const { data } = await api("/events", { method: "POST", body: photo ? formWithFile("image", photo, body) : body });
    const created = toOrganiserEvent(data, account);
    updateOrganiserEvents(userId, (list) => [...list, created]);
    return created;
  }

  // A live event keeps its last approved version public, with its favourites,
  // until the edit is approved (schema option b, agreed 2026-10-05)
  async function updateOrganiserEvent(eventId, body, photo) {
    const userId = organiserUserId;
    const { data } = await api(`/events/${eventId}`, {
      method: "PUT",
      body: photo ? formWithFile("image", photo, body) : body,
    });
    const updated = toOrganiserEvent(data, account);
    updateOrganiserEvents(userId, (list) => replaceById(list, "eventId", updated));
    return updated;
  }

  async function deleteOrganiserEvent(eventId) {
    const userId = organiserUserId;
    await api(`/events/${eventId}`, { method: "DELETE" });
    updateOrganiserEvents(userId, (list) => list.filter((event) => event.eventId !== eventId));
  }

  // An edit still waiting is dropped: the approved version is the one cancelled
  async function cancelOrganiserEvent(eventId) {
    const userId = organiserUserId;
    const { data } = await api(`/events/${eventId}/cancel`, { method: "PUT" });
    const cancelled = toOrganiserEvent(data, account);
    updateOrganiserEvents(userId, (list) => replaceById(list, "eventId", cancelled));
  }

  // Matches submit_draft.inc.php: the draft becomes pending
  async function submitDraft(eventId) {
    const userId = organiserUserId;
    const { data } = await api(`/events/${eventId}/submit`, { method: "PUT" });
    const submitted = toOrganiserEvent(data, account);
    updateOrganiserEvents(userId, (list) => replaceById(list, "eventId", submitted));
  }

  return {
    organiserEvents,
    organiserEventsLoaded,
    createOrganiserEvent,
    updateOrganiserEvent,
    deleteOrganiserEvent,
    cancelOrganiserEvent,
    submitDraft,
  };
}
