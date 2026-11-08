import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formWithFile } from "../lib/api";

// The logged-in account from /auth/me (publicUser on the backend), or null,
// and Settings' handlers. Each handler throws the ApiError for its section to
// show, and the account the server sends back updates the sidebar and greeting
export function useAccount() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  // Nothing is shown until /auth/me answers, so a refresh on a dashboard page
  // doesn't send a logged-in person to the home page first
  const [accountLoaded, setAccountLoaded] = useState(false);

  // A 401 means nobody is logged in. Any other failure (the API is down)
  // also shows the public site, rather than a page that can't load. Read
  // again after the email is verified, so the banners go without a reload
  const refreshAccount = useCallback(
    () =>
      api("/auth/me")
        .then(({ data }) => setAccount(data))
        .catch(() => setAccount(null)),
    [],
  );

  useEffect(() => {
    refreshAccount().finally(() => setAccountLoaded(true));
  }, [refreshAccount]);

  async function saveAccount(changes) {
    const { data } = await api("/users/me", { method: "PUT", body: changes });
    setAccount(data);
    return data;
  }

  // The name, then the picture (Cloudinary), each saved on its own: if the
  // picture fails, the name has still been saved and Save sends only the
  // picture again. Answers the picture's address for the form to show
  async function saveProfile({ user, avatarFile, removeAvatar }) {
    let latest = account;
    if (user !== account.username) latest = await saveAccount({ username: user });
    if (avatarFile || removeAvatar) {
      latest = (
        await api("/users/me/avatar", avatarFile
          ? { method: "PUT", body: formWithFile("avatar", avatarFile) }
          : { method: "DELETE" })
      ).data;
      setAccount(latest);
    }
    return latest.avatar ?? null;
  }

  // The server checks the password and the deletion rule, and ends the session
  async function deleteAccount(password) {
    await api("/users/me", { method: "DELETE", body: { password } });
    setAccount(null);
    navigate("/");
  }

  // If the request fails the server session may live on until it expires,
  // but this tab is logged out either way
  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setAccount(null);
    navigate("/");
  }

  return { account, accountLoaded, setAccount, refreshAccount, saveAccount, saveProfile, deleteAccount, logout };
}
