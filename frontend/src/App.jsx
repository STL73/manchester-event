import { Fragment, lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Faq from "./pages/Faq";
import LegalPage from "./pages/LegalPage";
import ExploreEvents from "./pages/ExploreEvents";
import EventDetails from "./pages/EventDetails";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import NotFound from "./pages/NotFound";
import { getData, getUserData } from "./data/navigationData";
import { api } from "./lib/api";
import { toEvent } from "./lib/publicEvents";
import { mockUsers } from "./data/manageUsersData";
import { currentAdmin, getManagedEvents } from "./data/manageEventsData";
import { currentOrganiser } from "./data/organiserEventsData";
import { initialEvents, publicVersion, snapshotOf } from "./data/eventsData";
import { privacyPage, termsPage } from "./data/legalPagesData";
import { initialFavouriteIds } from "./data/myFavouritesData";
import { userCategoryIds } from "./data/preferencesData";
import { initialContactMessages } from "./data/contactMessagesData";
import { initialNotifications } from "./data/notificationsData";
import { passwordChangedNotification } from "./data/profileSettingsData";

import PageLoading from "./components/UI/PageLoading";
import FavouriteError from "./components/events/FavouriteError";
import "./App.css";

// The dashboard and its pages download only when someone signs in, so a
// visitor to the public site never loads them. Explore Events and Event
// details stay in the main bundle: the public pages use them too. The
// analytics pages also keep Recharts out of everything else
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const MyFavourites = lazy(() => import("./pages/MyFavourites"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateEvents = lazy(() => import("./pages/CreateEvents"));
const MyEvents = lazy(() => import("./pages/MyEvents"));
const MyDrafts = lazy(() => import("./pages/MyDrafts"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const ManageEvents = lazy(() => import("./pages/ManageEvents"));
const SystemLogs = lazy(() => import("./pages/SystemLogs"));
const ContactMessages = lazy(() => import("./pages/ContactMessages"));
const EventAnalytics = lazy(() => import("./pages/EventAnalytics"));
const SiteAnalytics = lazy(() => import("./pages/SiteAnalytics"));

// React reuses a page when only a URL parameter changes, so an edit form
// would keep the previous record's status and message. A new key per ID
// starts the page fresh
// A role's own pages: anyone else who types the address goes to their Home,
// as the API will refuse them. Home, Event details, Notifications and
// Settings are everyone's
function RoleOnly({ allow, userType }) {
  return [allow].flat().includes(userType) ? <Outlet /> : <Navigate to="/dashboard/home" replace />;
}

// The old Edit Status / Edit User addresses open the item's side panel
// on the list instead (Manage Events and Manage Users, decided 2026-10-12)
function OpenInPanel({ param, to }) {
  const params = useParams();
  return <Navigate to={`${to}?open=${params[param]}`} replace />;
}

function ResetOnParam({ param, children }) {
  const params = useParams();
  return <Fragment key={params[param]}>{children}</Fragment>;
}

function App() {
  const { pathname } = useLocation();
  // The dashboard has its own sidebar and top bar, so the public navbar stays out
  const showNavbar = !pathname.startsWith("/dashboard");
  // footer.php was only included on public pages, never on the dashboard or login
  const showFooter = !["/dashboard", "/auth"].some((path) =>
    pathname.startsWith(path)
  );
  const navigate = useNavigate();
  // The logged-in account from /auth/me (publicUser on the backend), or null.
  // Roles are real: each dashboard is tried by logging in as its demo account
  const [account, setAccount] = useState(null);
  // Nothing is shown until /auth/me answers, so a refresh on a dashboard page
  // doesn't send a logged-in person to the home page first
  const [accountLoaded, setAccountLoaded] = useState(false);
  const isUser = Boolean(account);
  const userType = account?.role;
  // The one events list; every page reads a view of it (see eventsData.js)
  const [events, setEvents] = useState(initialEvents);
  // Users and guests see an edit waiting for approval as its last approved
  // version (publicVersion); organisers and admins see the real record
  const audienceEvents = events.map(publicVersion);
  // The public pages (Home, Explore Events, About, Preferences, Event details
  // for guests and users) read events from the API since Phase 3, and the
  // user's favourites since Phase 4; "New in your interests" still reads this
  // list until Phase 7
  const [users, setUsers] = useState(mockUsers);
  const organiserEvents = events.filter(
    (event) => event.organiserId === currentOrganiser.id,
  );
  const managedEvents = getManagedEvents(events);
  // The user role's favourites and interests (category_follows), loaded from
  // the API after login and kept with the account they belong to, so the next
  // account to log in never sees them. favouriteIds is what the hearts show:
  // it changes at once, and favouriteEvents (each as the public sees it)
  // catches up when the server has answered
  const listsUserId = userType === "user" ? account.userId : null;
  const [userLists, setUserLists] = useState({ userId: null });
  const listsLoaded = listsUserId !== null && userLists.userId === listsUserId;
  const favouriteIds = listsLoaded ? userLists.favouriteIds : [];
  const favouriteEvents = listsLoaded ? userLists.favouriteEvents : [];
  const interestIds = listsLoaded ? userLists.interestIds : [];
  // Why a heart couldn't change, shown over the page for a moment
  const [favouriteError, setFavouriteError] = useState(null);
  // Sent from the public Contact form, read on the admin Contact Messages page
  const [contactMessages, setContactMessages] = useState(initialContactMessages);
  // Read on the Notifications page and counted on the user dashboard, so
  // marking one read shows everywhere
  const [notifications, setNotifications] = useState(initialNotifications);
  // The picture chosen on Settings, laid over the account until Phase 6
  // stores it, so the sidebar and greeting show it. Cleared on logout
  const [profileChanges, setProfileChanges] = useState({});

  // A 401 means nobody is logged in. Any other failure (the API is down)
  // also shows the public site, rather than a page that can't load
  useEffect(() => {
    api("/auth/me")
      .then(({ data }) => setAccount(data))
      .catch(() => setAccount(null))
      .finally(() => setAccountLoaded(true));
  }, []);

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
        setFavouriteError(error.message);
      },
    );
    return () => {
      current = false;
    };
  }, [listsUserId]);

  // Changes the lists only while they still belong to the same account
  const updateUserLists = useCallback(
    (userId, change) =>
      setUserLists((current) => (current.userId === userId ? { ...current, ...change(current) } : current)),
    [],
  );

  // After the email is verified, so the banners go without a reload
  const refreshAccount = useCallback(() => {
    api("/auth/me")
      .then(({ data }) => setAccount(data))
      .catch(() => setAccount(null));
  }, []);

  // Sets read_at on the ones not read yet; a read notification keeps its time
  function markNotificationsRead(notificationIds) {
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notificationIds.includes(notification.notificationId) && !notification.readAt
          ? { ...notification, readAt }
          : notification,
      ),
    );
  }

  // Matches save_contact_message(): the user ID is stored when signed in
  function sendContactMessage({ name, email, message }) {
    const signedInUser = isUser
      ? users.find((user) => user.email === selectedUser.email)
      : null;
    setContactMessages((currentMessages) => [
      ...currentMessages,
      {
        messageId:
          Math.max(0, ...currentMessages.map((item) => item.messageId)) + 1,
        userId: signedInUser?.userId ?? null,
        name,
        email,
        message,
        sentAt: new Date().toISOString(),
        readAt: null,
        repliedAt: null,
        repliedBy: null,
        replyBody: null,
      },
    ]);
  }

  // Contact Messages: opening one reads it (read_at); Mark as unread clears it
  function setContactMessageRead(messageId, isRead) {
    const readAt = isRead ? new Date().toISOString() : null;
    setContactMessages((currentMessages) =>
      currentMessages.map((item) =>
        item.messageId === messageId && Boolean(item.readAt) !== isRead ? { ...item, readAt } : item,
      ),
    );
  }

  // The reply is stored on the message (reply_body, replied_at, replied_by);
  // sending the email itself is the backend's job
  function replyToContactMessage(messageId, replyBody) {
    const now = new Date().toISOString();
    setContactMessages((currentMessages) =>
      currentMessages.map((item) =>
        item.messageId === messageId
          ? { ...item, replyBody, repliedAt: now, repliedBy: currentAdmin.id, readAt: item.readAt ?? now }
          : item,
      ),
    );
  }

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

    setFavouriteError(null);
    setSaved(saving);
    try {
      await api(`/users/me/favourites/${eventId}`, { method: saving ? "PUT" : "DELETE" });
    } catch (error) {
      setSaved(!saving);
      setFavouriteError(error.message);
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
  const data = getData();
  // The role's sidebar links and default icon from navigationData, with the
  // account's own name, email and picture
  const selectedUser = {
    ...getUserData(userType),
    ...(account && {
      user: account.username,
      email: account.email,
      emailNotifications: account.emailNotifications,
      ...(account.avatar && { avatarUrl: account.avatar }),
    }),
    ...profileChanges,
  };
  // The sidebar's badges: the same filters as the Home cards, so the two agree
  const navCounts = {
    unreadNotifications: notifications.filter(
      (notification) => notification.recipient === userType && !notification.readAt,
    ).length,
    drafts: organiserEvents.filter((event) => event.status === "draft").length,
    rejected: organiserEvents.filter((event) => event.status === "rejected").length,
    toReview: events.filter((event) => event.status === "pending").length,
    unreadMessages: contactMessages.filter((message) => !message.readAt).length,
  };
  // Settings' handlers. Each throws the ApiError for its section to show, and
  // the account the server sends back updates the sidebar and greeting
  async function saveAccount(changes) {
    const { data } = await api("/users/me", { method: "PUT", body: changes });
    setAccount(data);
  }

  // The name is saved on the server; the picture stays in this tab until
  // Phase 6 stores it
  async function saveProfile({ user, avatarUrl }) {
    if (user !== account.username) await saveAccount({ username: user });
    setProfileChanges({ avatarUrl });
  }

  // The server logs out every other device and gives this one a new session
  async function changePassword(passwords) {
    await api("/auth/password", { method: "PUT", body: passwords });
    addPasswordChangedNotification();
  }

  // The server checks the password and the deletion rule, and ends the session
  async function deleteAccount(password) {
    await api("/users/me", { method: "DELETE", body: { password } });
    setAccount(null);
    setProfileChanges({});
    navigate("/");
  }

  // A password change is a password_changed notification, as the backend
  // will send from Phase 7; newest first, like the rest of the list
  function addPasswordChangedNotification() {
    setNotifications((current) => [
      {
        notificationId: Math.max(0, ...current.map((item) => item.notificationId)) + 1,
        recipient: userType,
        eventId: null,
        type: "password_changed",
        subject: passwordChangedNotification.subject,
        body: passwordChangedNotification.body,
        createdAt: new Date().toISOString(),
        readAt: null,
      },
      ...current,
    ]);
  }

  // If the request fails the server session may live on until it expires,
  // but this tab is logged out either way
  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setAccount(null);
    setProfileChanges({});
    navigate("/");
  }

  function deleteUser(userId) {
    setUsers((currentUsers) =>
      currentUsers.filter((user) => user.userId !== userId),
    );
  }

  // Matches update_user_status(), plus the schema's suspended_until (NULL
  // = until lifted) and suspension_reason; lifting a suspension clears both
  function updateUserStatus(userId, { accStatus, suspendedUntil = null, suspensionReason = null }) {
    const updatedAt = new Date().toISOString();
    const suspended = accStatus === "suspended";
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.userId === userId
          ? {
              ...user,
              accStatus,
              suspendedUntil: suspended ? suspendedUntil : null,
              suspensionReason: suspended ? suspensionReason : null,
              updatedAt,
            }
          : user,
      ),
    );
  }

  // Matches update_event_status(): records which admin changed it and when.
  // Approving publishes a pending edit, so the old public copy goes; a
  // rejection keeps its reason (rejection_reason) for the organiser
  function updateEventStatus(eventId, status, rejectionReason = null) {
    const adminUpdatedAt = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.eventId === eventId
          ? {
              ...event,
              status,
              approvedSnapshot: status === "approved" ? null : event.approvedSnapshot,
              rejectionReason: status === "rejected" ? rejectionReason : null,
              adminId: currentAdmin.id,
              adminName: currentAdmin.name,
              adminUpdatedAt,
            }
          : event,
      ),
    );
  }

  // Matches insert_event(): new events get the next ID, the organiser and
  // today's dates; no admin has reviewed them yet
  function createOrganiserEvent(newEvent) {
    const now = new Date().toISOString();
    setEvents((currentEvents) => [
      ...currentEvents,
      {
        ...newEvent,
        eventId: Math.max(0, ...currentEvents.map((event) => event.eventId)) + 1,
        organiserId: currentOrganiser.id,
        organiser: currentOrganiser.name,
        adminId: null,
        adminName: null,
        adminUpdatedAt: null,
        orgUpdatedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }

  function deleteOrganiserEvent(eventId) {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.eventId !== eventId),
    );
  }

  // Matches update_event(): saves the organiser's changes. Drafts keep the
  // status the organiser chose; any other edit goes back to pending for the
  // admin to approve again. Unlike the PHP (remove_favourite_after_update()),
  // a live event keeps its last approved version public and its favourites
  // until the edit is approved (schema option b, agreed 2026-10-05)
  function updateOrganiserEvent(eventId, changes, status) {
    const now = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.eventId === eventId
          ? {
              ...event,
              ...changes,
              status,
              approvedSnapshot:
                event.approvedSnapshot ?? (event.status === "approved" ? snapshotOf(event) : null),
              orgUpdatedAt: now,
              updatedAt: now,
            }
          : event,
      ),
    );
  }

  // Matches the Cancel Event button in edit_event.php
  function cancelOrganiserEvent(eventId) {
    const now = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        // An edit still waiting is dropped: the public version is cancelled
        event.eventId === eventId
          ? { ...publicVersion(event), status: "cancelled", approvedSnapshot: null, orgUpdatedAt: now, updatedAt: now }
          : event,
      ),
    );
  }

  // Matches submit_draft.inc.php: the draft becomes pending
  function submitDraft(eventId) {
    const updatedAt = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.eventId === eventId
          ? { ...event, status: "pending", updatedAt }
          : event,
      ),
    );
  }

  if (!accountLoaded) return <PageLoading />;

  return (
    <div className="app">
      <ScrollToTop />
      {showNavbar && (
        <Navbar isUser={isUser} onLogout={logout} />
      )}
      {/* @container: shared parts (filter bar, event grid) size themselves by
          the space they have, here or in the dashboard's content box */}
      <main className={`@container flex-1 ${showNavbar ? "pt-16" : ""}`}>
        <Routes>
          {/* The landing page is for guests: signed-in users go to their
              dashboard. The other public pages stay open to everyone, so a
              shared event link still works */}
          <Route
            path="/"
            element={isUser ? <Navigate to="/dashboard/home" replace /> : <Home />}
          />
          <Route path="/auth/verify-email" element={<VerifyEmail isUser={isUser} onVerified={refreshAccount} />} />
          <Route path="/auth/:pathname" element={<Auth isUser={isUser} onAccountChange={setAccount} />} />
          <Route path="/about" element={<About isUser={isUser} />} />
          <Route path="/contact" element={<Contact onSendMessage={sendContactMessage} />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<LegalPage page={privacyPage} titleId="privacy-title" />} />
          <Route path="/terms" element={<LegalPage page={termsPage} titleId="terms-title" />} />
          <Route path="/events" element={<ExploreEvents />} />
          <Route path="/events/:eventId" element={<EventDetails events={audienceEvents} role={isUser ? userType : "guest"} organiserId={currentOrganiser.id} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
          <Route
            path="/dashboard"
            element={
              isUser ? (
                <Suspense fallback={<PageLoading />}>
                  <Dashboard
                    selectedUser={selectedUser}
                    secondaryNav={data[1].secondaryNav}
                    navCounts={navCounts}
                    onLogout={logout}
                  />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<DashboardHome selectedUser={selectedUser} account={account} users={users} events={userType === "user" ? audienceEvents : events} organiserEvents={organiserEvents} onDeleteEvent={deleteOrganiserEvent} favouriteIds={favouriteIds} favouriteEvents={favouriteEvents} onToggleFavourite={toggleFavourite} interestIds={interestIds} contactMessages={contactMessages} notifications={notifications} />} />
            <Route element={<RoleOnly allow="user" userType={userType} />}>
              <Route path="explore-events" element={<ExploreEvents inDashboard selectedUser={selectedUser} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
              <Route path="my-favourites" element={<MyFavourites events={favouriteEvents} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
              <Route path="preferences" element={listsLoaded ? <Preferences key={listsUserId} interestIds={interestIds} onSaveInterests={saveInterests} /> : <PageLoading />} />
            </Route>
            <Route path="events/:eventId" element={<EventDetails inDashboard events={events} role={userType} organiserId={currentOrganiser.id} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
            <Route path="notifications" element={<Notifications selectedUser={selectedUser} notifications={notifications} onMarkRead={markNotificationsRead} />} />
            {/* The public pages the sidebar links to, opened beside it: About,
                Privacy and Terms for everyone (under the user card), FAQs and
                Contact for the roles with a Help menu */}
            <Route path="about" element={<About inDashboard isUser={isUser} />} />
            <Route path="privacy" element={<LegalPage inDashboard page={privacyPage} titleId="privacy-title" />} />
            <Route path="terms" element={<LegalPage inDashboard page={termsPage} titleId="terms-title" />} />
            <Route element={<RoleOnly allow={["user", "organiser"]} userType={userType} />}>
              <Route path="faq" element={<Faq inDashboard />} />
              <Route path="contact" element={<Contact inDashboard account={{ name: selectedUser.user, email: selectedUser.email }} onSendMessage={sendContactMessage} />} />
            </Route>
            {/* key: another account starts the forms from its own details */}
            <Route
              path="settings"
              element={
                <Settings
                  key={account?.userId}
                  selectedUser={selectedUser}
                  account={account}
                  onSaveProfile={saveProfile}
                  onChangePassword={changePassword}
                  onEmailNotificationsChange={(emailNotifications) => saveAccount({ emailNotifications })}
                  onDeleteAccount={deleteAccount}
                />
              }
            />
            <Route element={<RoleOnly allow="organiser" userType={userType} />}>
              <Route path="create-events" element={<CreateEvents onCreateEvent={createOrganiserEvent} />} />
              <Route path="my-events" element={<MyEvents organiserEvents={organiserEvents} onDeleteEvent={deleteOrganiserEvent} />} />
              <Route path="my-events/:eventId/edit" element={<ResetOnParam param="eventId"><CreateEvents mode="edit" events={organiserEvents} onUpdateEvent={updateOrganiserEvent} onCancelEvent={cancelOrganiserEvent} onDeleteEvent={deleteOrganiserEvent} /></ResetOnParam>} />
              <Route path="my-drafts" element={<MyDrafts organiserEvents={organiserEvents} onSubmitDraft={submitDraft} onDeleteEvent={deleteOrganiserEvent} />} />
              {/* The analytics pages count everyone's saves and follows, so
                  they keep the mock ones until Phase 10 */}
              <Route path="event-analytics" element={<EventAnalytics organiserEvents={organiserEvents} favouriteIds={initialFavouriteIds} interestIds={userCategoryIds} />} />
            </Route>
            <Route element={<RoleOnly allow="admin" userType={userType} />}>
              <Route path="manage-users" element={<ManageUsers users={users} events={events} currentUserId={currentAdmin.id} onUpdateUser={updateUserStatus} onDeleteUser={deleteUser} />} />
              <Route path="manage-users/:userId/edit" element={<OpenInPanel param="userId" to="/dashboard/manage-users" />} />
              <Route path="manage-events" element={<ManageEvents events={managedEvents} onUpdateEventStatus={updateEventStatus} />} />
              <Route path="manage-events/:eventId/edit" element={<OpenInPanel param="eventId" to="/dashboard/manage-events" />} />
              <Route path="site-analytics" element={<SiteAnalytics users={users} events={events} contactMessages={contactMessages} favouriteIds={initialFavouriteIds} interestIds={userCategoryIds} />} />
              <Route path="system-logs" element={<SystemLogs events={events} users={users} />} />
              <Route path="contact-messages" element={<ContactMessages contactMessages={contactMessages} users={users} onSetRead={setContactMessageRead} onReply={replyToContactMessage} />} />
            </Route>
            <Route path="*" element={<NotFound inDashboard />} />
          </Route>
          {/* Any other address, e.g. a mistyped /home, gets a proper 404
              instead of an empty page */}
          <Route path="*" element={<NotFound isUser={isUser} />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
      <FavouriteError message={favouriteError} onDismiss={() => setFavouriteError(null)} />
    </div>
  );
}

export default App;
