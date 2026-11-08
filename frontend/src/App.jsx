import { Fragment, lazy, Suspense, useCallback, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
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
import { getUserData, secondaryNav } from "./data/navigationData";
import { api } from "./lib/api";
import { useAccount } from "./hooks/useAccount";
import { useNotifications } from "./hooks/useNotifications";
import { useUserLists } from "./hooks/useUserLists";
import { useOrganiserEvents } from "./hooks/useOrganiserEvents";
import { useAdminLists } from "./hooks/useAdminLists";
import { privacyPage, termsPage } from "./data/legalPagesData";

import PageLoading from "./components/UI/PageLoading";
import ListError from "./components/UI/ListError";
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
  // Roles are real: each dashboard is tried by logging in as its demo account
  const { account, accountLoaded, setAccount, refreshAccount, saveAccount, saveProfile, deleteAccount, logout } =
    useAccount();
  const isUser = Boolean(account);
  const userType = account?.role;
  // Why a list couldn't load or a heart couldn't change, shown over the page
  // for a moment. The dismiss keeps one identity, so the popup's timer isn't
  // restarted each time App renders
  const [listError, setListError] = useState(null);
  const dismissListError = useCallback(() => setListError(null), []);
  const { notifications, loadNotifications, markNotificationsRead } = useNotifications(account?.userId ?? null);
  const { listsLoaded, favouriteIds, favouriteEvents, interestIds, toggleFavourite, saveInterests } = useUserLists(
    account,
    setListError,
  );
  const {
    organiserEvents,
    organiserEventsLoaded,
    createOrganiserEvent,
    updateOrganiserEvent,
    deleteOrganiserEvent,
    cancelOrganiserEvent,
    submitDraft,
  } = useOrganiserEvents(account, setListError);
  const {
    managedEvents,
    managedUsers,
    contactMessages,
    decideEvent,
    deleteUser,
    updateUserStatus,
    setContactMessageRead,
    replyToContactMessage,
  } = useAdminLists(account, setListError);

  // Matches save_contact_message() (Phase 9). Signed in, the server takes the
  // name and email from the account and ignores the form's. Awaits the server
  // and throws its ApiError for the form to show
  async function sendContactMessage(fields) {
    await api("/contact-messages", { method: "POST", body: fields });
  }

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
  };
  // The sidebar's badges: the same filters as the Home cards, so the two agree
  const navCounts = {
    unreadNotifications: (notifications ?? []).filter((notification) => !notification.readAt).length,
    drafts: organiserEvents.filter((event) => event.status === "draft").length,
    rejected: organiserEvents.filter((event) => event.status === "rejected").length,
    toReview: (managedEvents ?? []).filter((event) => event.status === "pending").length,
    unreadMessages: (contactMessages ?? []).filter((message) => !message.readAt).length,
  };
  // The server logs out every other device, gives this one a new session and
  // adds a password_changed notification, which the inbox then shows. Here
  // rather than in useAccount, since it needs the inbox too
  async function changePassword(passwords) {
    await api("/auth/password", { method: "PUT", body: passwords });
    loadNotifications();
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
          <Route path="/events/:eventId" element={<EventDetails ownEvents={organiserEventsLoaded ? organiserEvents : null} role={isUser ? userType : "guest"} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
          <Route
            path="/dashboard"
            element={
              isUser ? (
                <Suspense fallback={<PageLoading />}>
                  <Dashboard
                    selectedUser={selectedUser}
                    secondaryNav={secondaryNav}
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
            <Route path="home" element={<DashboardHome selectedUser={selectedUser} account={account} users={managedUsers ?? []} events={managedEvents ?? []} organiserEvents={organiserEvents} onDeleteEvent={deleteOrganiserEvent} favouriteIds={favouriteIds} favouriteEvents={favouriteEvents} onToggleFavourite={toggleFavourite} interestIds={interestIds} contactMessages={contactMessages ?? []} notifications={notifications ?? []} onLoadNotifications={loadNotifications} />} />
            <Route element={<RoleOnly allow="user" userType={userType} />}>
              <Route path="explore-events" element={<ExploreEvents inDashboard selectedUser={selectedUser} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
              <Route path="my-favourites" element={<MyFavourites events={favouriteEvents} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
              <Route path="preferences" element={listsLoaded ? <Preferences key={account?.userId}interestIds={interestIds} onSaveInterests={saveInterests} /> : <PageLoading />} />
            </Route>
            <Route path="events/:eventId" element={<EventDetails inDashboard ownEvents={userType === "admin" ? managedEvents : organiserEventsLoaded ? organiserEvents : null} role={userType} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
            <Route path="notifications" element={<Notifications notifications={notifications} onLoad={loadNotifications} onMarkRead={markNotificationsRead} />} />
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
                  account={account}
                  defaultAvatar={selectedUser.avatar}
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
              <Route path="my-events/:eventId/edit" element={<ResetOnParam param="eventId"><CreateEvents mode="edit" events={organiserEventsLoaded ? organiserEvents : null} onUpdateEvent={updateOrganiserEvent} onCancelEvent={cancelOrganiserEvent} onDeleteEvent={deleteOrganiserEvent} /></ResetOnParam>} />
              <Route path="my-drafts" element={<MyDrafts organiserEvents={organiserEvents} onSubmitDraft={submitDraft} onDeleteEvent={deleteOrganiserEvent} />} />
              <Route path="event-analytics" element={<EventAnalytics organiserEvents={organiserEventsLoaded ? organiserEvents : null} />} />
            </Route>
            <Route element={<RoleOnly allow="admin" userType={userType} />}>
              <Route path="manage-users" element={<ManageUsers users={managedUsers} currentUserId={account?.userId} onUpdateUser={updateUserStatus} onDeleteUser={deleteUser} />} />
              <Route path="manage-users/:userId/edit" element={<OpenInPanel param="userId" to="/dashboard/manage-users" />} />
              <Route path="manage-events" element={<ManageEvents events={managedEvents} currentUserId={account?.userId} onDecide={decideEvent} />} />
              <Route path="manage-events/:eventId/edit" element={<OpenInPanel param="eventId" to="/dashboard/manage-events" />} />
              <Route path="site-analytics" element={<SiteAnalytics users={managedUsers} events={managedEvents} contactMessages={contactMessages} />} />
              <Route path="system-logs" element={<SystemLogs />} />
              <Route path="contact-messages" element={<ContactMessages contactMessages={contactMessages} users={managedUsers ?? []} currentUserId={account?.userId} onSetRead={setContactMessageRead} onReply={replyToContactMessage} />} />
            </Route>
            <Route path="*" element={<NotFound inDashboard />} />
          </Route>
          {/* Any other address, e.g. a mistyped /home, gets a proper 404
              instead of an empty page */}
          <Route path="*" element={<NotFound isUser={isUser} />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
      <ListError message={listError} onDismiss={dismissListError} />
    </div>
  );
}

export default App;
