import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { toEvent } from "../lib/publicEvents";

// The user role's favourites and interests (category_follows), loaded from
// the API after login and kept with the account they belong to, so the next
// account to log in never sees them. favouriteIds is what the hearts show:
// it changes at once, and favouriteEvents (each as the public sees it)
// catches up when the server has answered
export function useUserLists(account, showError) {
  const listsUserId = account?.role === "user" ? account.userId : null;
  const [userLists, setUserLists] = useState({ userId: null });
  const listsLoaded = listsUserId !== null && userLists.userId === listsUserId;
  const favouriteIds = listsLoaded ? userLists.favouriteIds : [];
  const favouriteEvents = listsLoaded ? userLists.favouriteEvents : [];
  const interestIds = listsLoaded ? userLists.interestIds : [];

  // If either list can't be read the user starts with none, rather than a
  // dashboard that never loads; the error says so
  useEffect(() => {
    if (listsUserId === null) return undefined;
    let current = true;
    Promise.all([api("/users/me/favourites"), api("/users/me/follows")]).then(
      ([favourites, follows]) =>
        current &&
        setUserLists({
          userId: listsUserId,
          favouriteIds: favourites.data.map((event) => event.eventId),
          favouriteEvents: favourites.data.map(toEvent),
          interestIds: follows.data,
        }),
      (error) => {
        if (!current) return;
        setUserLists({ userId: listsUserId, favouriteIds: [], favouriteEvents: [], interestIds: [] });
        showError(error.message);
      },
    );
    return () => {
      current = false;
    };
  }, [listsUserId, showError]);

  // Changes the lists only while they still belong to the same account
  const updateUserLists = useCallback(
    (userId, change) =>
      setUserLists((current) => (current.userId === userId ? { ...current, ...change(current) } : current)),
    [],
  );

  // Matches add_favourite / remove_favourites in the PHP. The heart changes
  // at once and changes back with the server's reason if the request fails
  // (an event that has ended or been cancelled since the page loaded)
  async function toggleFavourite(eventId) {
    const userId = listsUserId;
    const saving = !favouriteIds.includes(eventId);
    const setSaved = (saved) =>
      updateUserLists(userId, ({ favouriteIds: ids }) => ({
        favouriteIds: saved ? [...ids.filter((id) => id !== eventId), eventId] : ids.filter((id) => id !== eventId),
      }));

    showError(null);
    setSaved(saving);
    try {
      await api(`/users/me/favourites/${eventId}`, { method: saving ? "PUT" : "DELETE" });
    } catch (error) {
      setSaved(!saving);
      showError(error.message);
      return;
    }
    // A new save needs the event as the public sees it, for My Favourites and
    // Home. If this read fails the heart is still right; the list catches up
    // on the next login
    if (saving) {
      api("/users/me/favourites")
        .then(({ data }) => updateUserLists(userId, () => ({ favouriteEvents: data.map(toEvent) })))
        .catch(() => {});
    }
  }

  // Preferences awaits this and shows the server's refusal
  async function saveInterests(categoryIds) {
    const userId = listsUserId;
    const { data } = await api("/users/me/follows", { method: "PUT", body: { categories: categoryIds } });
    updateUserLists(userId, () => ({ interestIds: data }));
  }

  return { listsLoaded, favouriteIds, favouriteEvents, interestIds, toggleFavourite, saveInterests };
}
