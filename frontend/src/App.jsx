import { Fragment, lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Faq from "./pages/Faq";
import LegalPage from "./pages/LegalPage";
import ExploreEvents from "./pages/ExploreEvents";
import EventDetails from "./pages/EventDetails";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import DashboardHome from "./pages/DashboardHome";
import MyFavourites from "./pages/MyFavourites";
import Preferences from "./pages/Preferences";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import CreateEvents from "./pages/CreateEvents";
import MyEvents from "./pages/MyEvents";
import MyDrafts from "./pages/MyDrafts";
import ManageUsers from "./pages/ManageUsers";
import EditUser from "./pages/EditUser";
import ManageEvents from "./pages/ManageEvents";
import EditEventStatus from "./pages/EditEventStatus";
import SystemLogs from "./pages/SystemLogs";
import ContactMessages from "./pages/ContactMessages";
import NotFound from "./pages/NotFound";
import { TEST_USER_TYPE, getData, getUserData } from "./data/navigationData";
import { mockUsers } from "./data/manageUsersData";
import { currentAdmin, getManagedEvents } from "./data/manageEventsData";
import { currentOrganiser } from "./data/organiserEventsData";
import { initialEvents, isPublicEvent } from "./data/eventsData";
import { privacyPage, termsPage } from "./data/legalPagesData";
import { initialFavouriteIds } from "./data/myFavouritesData";
import { initialContactMessages } from "./data/contactMessagesData";

import "./App.css";

// Analytics pages load Recharts, so they are only downloaded when opened
const EventAnalytics = lazy(() => import("./pages/EventAnalytics"));
const SiteAnalytics = lazy(() => import("./pages/SiteAnalytics"));

function PageLoading() {
  return <p className="dashboard-empty-text p-4">Loading…</p>;
}

// React reuses a page when only a URL parameter changes, so an edit form
// would keep the previous record's status and message. A new key per ID
// starts the page fresh
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
  const [isUser, setIsUser] = useState(true);
  const [userType, setUserType] = useState(TEST_USER_TYPE);
  // Shared by Manage Users and Edit User so changes survive navigating between them
  const [users, setUsers] = useState(mockUsers);
  // The one events list; every page reads a view of it (see eventsData.js)
  const [events, setEvents] = useState(initialEvents);
  const publicEvents = events.filter(isPublicEvent);
  const organiserEvents = events.filter(
    (event) => event.organiserId === currentOrganiser.id,
  );
  const managedEvents = getManagedEvents(events);
  // Shared by the user dashboard, My Favourites and Explore Events
  const [favouriteIds, setFavouriteIds] = useState(initialFavouriteIds);
  // Sent from the public Contact form, read on the admin Contact Messages page
  const [contactMessages, setContactMessages] = useState(initialContactMessages);

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
      },
    ]);
  }

  // Matches add_favourite / remove_favourites in the PHP
  function toggleFavourite(eventId) {
    setFavouriteIds((currentIds) =>
      currentIds.includes(eventId)
        ? currentIds.filter((id) => id !== eventId)
        : [...currentIds, eventId],
    );
  }
  const data = getData();
  const userTypes = data[0].role.map(({ type }) => type);
  const selectedUser = getUserData(userType);

  function deleteUser(userId) {
    setUsers((currentUsers) =>
      currentUsers.filter((user) => user.userId !== userId),
    );
  }

  function updateUserStatus(userId, accStatus) {
    const updatedAt = new Date().toISOString();
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.userId === userId ? { ...user, accStatus, updatedAt } : user,
      ),
    );
  }

  // Matches update_event_status(): records which admin changed it and when
  function updateEventStatus(eventId, status) {
    const adminUpdatedAt = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.eventId === eventId
          ? {
              ...event,
              status,
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
  // admin to approve again, and (like remove_favourite_after_update()) the
  // event is removed from everyone's favourites
  function updateOrganiserEvent(eventId, changes, status) {
    const now = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.eventId === eventId
          ? { ...event, ...changes, status, orgUpdatedAt: now, updatedAt: now }
          : event,
      ),
    );
    setFavouriteIds((currentIds) => currentIds.filter((id) => id !== eventId));
  }

  // Matches the Cancel Event button in edit_event.php
  function cancelOrganiserEvent(eventId) {
    const now = new Date().toISOString();
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.eventId === eventId
          ? { ...event, status: "cancelled", orgUpdatedAt: now, updatedAt: now }
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

  function switchUserType() {
    const currentIndex = userTypes.indexOf(userType);
    const nextIndex = (currentIndex + 1) % userTypes.length;

    setUserType(userTypes[nextIndex]);
  }

  function toggleUserMode() {
    const nextIsUser = !isUser;

    setIsUser(nextIsUser);
    navigate(nextIsUser ? "/dashboard/home" : "/");
  }

  return (
    <div className="app">
      <ScrollToTop />
      {showNavbar && (
        <Navbar isUser={isUser} onToggleUserMode={toggleUserMode} />
      )}
      <main className={`flex-1 ${showNavbar ? "pt-16" : ""}`}>
        <Routes>
          {/* The landing page is for guests: signed-in users go to their
              dashboard. The other public pages stay open to everyone, so a
              shared event link still works */}
          <Route
            path="/"
            element={isUser ? <Navigate to="/dashboard/home" replace /> : <Home events={publicEvents} />}
          />
          <Route path="/auth/:pathname" element={<Auth />} />
          <Route path="/about" element={<About events={publicEvents} isUser={isUser} />} />
          <Route path="/contact" element={<Contact onSendMessage={sendContactMessage} />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<LegalPage page={privacyPage} titleId="privacy-title" />} />
          <Route path="/terms" element={<LegalPage page={termsPage} titleId="terms-title" />} />
          <Route path="/events" element={<ExploreEvents events={publicEvents} />} />
          <Route path="/events/:eventId" element={<EventDetails events={publicEvents} />} />
          <Route
            path="/dashboard"
            element={
              isUser ? (
                <Dashboard
                  selectedUser={selectedUser}
                  secondaryNav={data[1].secondaryNav}
                  onLogout={toggleUserMode}
                  onSwitchUserType={switchUserType}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<DashboardHome selectedUser={selectedUser} users={users} events={events} organiserEvents={organiserEvents} onDeleteEvent={deleteOrganiserEvent} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
            <Route path="explore-events" element={<ExploreEvents inDashboard events={publicEvents} selectedUser={selectedUser} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
            <Route path="my-favourites" element={<MyFavourites events={events} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />} />
            <Route path="events/:eventId" element={<EventDetails inDashboard events={events} />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="notifications" element={<Notifications selectedUser={selectedUser} events={events} />} />
            <Route path="settings" element={<Settings selectedUser={selectedUser} />} />
            <Route path="create-events" element={<CreateEvents onCreateEvent={createOrganiserEvent} />} />
            <Route path="my-events" element={<MyEvents organiserEvents={organiserEvents} onDeleteEvent={deleteOrganiserEvent} />} />
            <Route path="my-events/:eventId/edit" element={<ResetOnParam param="eventId"><CreateEvents mode="edit" events={organiserEvents} onUpdateEvent={updateOrganiserEvent} onCancelEvent={cancelOrganiserEvent} /></ResetOnParam>} />
            <Route path="my-drafts" element={<MyDrafts organiserEvents={organiserEvents} onSubmitDraft={submitDraft} onDeleteEvent={deleteOrganiserEvent} />} />
            <Route path="event-analytics" element={<Suspense fallback={<PageLoading />}><EventAnalytics organiserEvents={organiserEvents} /></Suspense>} />
            <Route path="manage-users" element={<ManageUsers users={users} onDeleteUser={deleteUser} />} />
            <Route path="manage-users/:userId/edit" element={<ResetOnParam param="userId"><EditUser users={users} onUpdateUserStatus={updateUserStatus} /></ResetOnParam>} />
            <Route path="manage-events" element={<ManageEvents events={managedEvents} />} />
            <Route path="manage-events/:eventId/edit" element={<ResetOnParam param="eventId"><EditEventStatus events={managedEvents} onUpdateEventStatus={updateEventStatus} /></ResetOnParam>} />
            <Route path="site-analytics" element={<Suspense fallback={<PageLoading />}><SiteAnalytics users={users} events={events} /></Suspense>} />
            <Route path="system-logs" element={<SystemLogs />} />
            <Route path="contact-messages" element={<ContactMessages contactMessages={contactMessages} />} />
            <Route path="*" element={<NotFound inDashboard />} />
          </Route>
          {/* Any other address, e.g. a mistyped /home, gets a proper 404
              instead of an empty page */}
          <Route path="*" element={<NotFound isUser={isUser} />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
