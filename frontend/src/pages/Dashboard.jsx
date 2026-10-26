import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Sidebar from "../components/layout/Sidebar";
import WeatherDateBar from "../components/dashboard/WeatherDateBar";
import PageLoading from "../components/UI/PageLoading";

// Must match the drawer's @media rule in App.css
const NARROW_QUERY = "(max-width: 768px)";
const COLLAPSED_KEY = "sidebarCollapsed";

function subscribeToNarrow(onChange) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getIsNarrow() {
  return window.matchMedia(NARROW_QUERY).matches;
}

// A convenience, so storage that is blocked (private windows) just forgets
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveCollapsed(isCollapsed) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(isCollapsed));
  } catch {
    // Not saved; the rail still works for this visit
  }
}

export default function Dashboard({
  selectedUser,
  secondaryNav,
  navCounts,
  onLogout,
  onSwitchUserType,
}) {
  const isNarrow = useSyncExternalStore(subscribeToNarrow, getIsNarrow);
  // Wide screens: the full sidebar or the icon rail, remembered
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readCollapsed);
  // Phones and tablets: a drawer over the page, shut on every visit
  const [isDrawerShown, setIsDrawerShown] = useState(false);
  // Widening the window with the drawer open leaves no drawer to close
  const isDrawerOpen = isNarrow && isDrawerShown;
  const toggleRef = useRef(null);
  const closeButtonRef = useRef(null);
  const containerRef = useRef(null);
  const { pathname } = useLocation();

  // ScrollToTop resets the window, but here the window never scrolls: this
  // container does, and it stays mounted from page to page, so each new page
  // would open at the last one's position. Only the path counts, as there
  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, [pathname]);

  function toggleSidebar() {
    if (isNarrow) {
      setIsDrawerShown(true);
      return;
    }
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    saveCollapsed(next);
  }

  function closeDrawer() {
    setIsDrawerShown(false);
  }

  // Focus goes into the drawer when it opens, and Escape shuts it
  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const toggle = toggleRef.current;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsDrawerShown(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Back to the menu button once it has closed: before then the page
      // is still inert and the button can't take focus
      toggle?.focus();
    };
  }, [isDrawerOpen]);

  return (
    <div className="dashboard-container" ref={containerRef}>
      <Sidebar
        id="dashboard-sidebar"
        selectedUser={selectedUser}
        secondaryNav={secondaryNav}
        navCounts={navCounts}
        isCollapsed={isSidebarCollapsed}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={closeDrawer}
        closeButtonRef={closeButtonRef}
        onLogout={onLogout}
        onSwitchUserType={onSwitchUserType}
      />
      {isDrawerOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeDrawer}
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}
      {/* inert: while the drawer is open, the page behind it can't be
          tabbed to or clicked */}
      <div className="dashboard-content" inert={isDrawerOpen}>
        <WeatherDateBar
          isNarrow={isNarrow}
          isSidebarOpen={isNarrow ? isDrawerOpen : !isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          toggleRef={toggleRef}
        />
        {/* Each page is its own download (see App); the sidebar and the
            weather bar stay while it arrives */}
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
