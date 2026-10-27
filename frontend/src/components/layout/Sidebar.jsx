import { X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { helpNavTitle } from "../../data/navigationData";
import LogoMark from "../UI/LogoMark";
import MainNav from "./MainNav";
import SecondaryNav from "./SecondaryNav";
import UserNav from "./UserNav";

export default function Sidebar({
  selectedUser,
  secondaryNav,
  navCounts,
  isCollapsed,
  isDrawerOpen,
  onCloseDrawer,
  closeButtonRef,
  onLogout,
  ...props
}) {
  const { pathname, state } = useLocation();
  // Event details and Edit Event highlight the page they were opened from
  // (sent by the View and Edit links)
  const opensFromAnotherPage =
    pathname.startsWith("/dashboard/events/") ||
    (pathname.startsWith("/dashboard/my-events/") && pathname.endsWith("/edit"));
  const activePath = opensFromAnotherPage && state?.from ? state.from : pathname;
  const roleLabel = selectedUser.type.charAt(0).toUpperCase() + selectedUser.type.slice(1);

  const className = [
    "sidebar",
    isCollapsed && "sidebar-collapsed",
    isDrawerOpen && "sidebar-drawer-open",
  ]
    .filter(Boolean)
    .join(" ");

  // On a phone the sidebar is a drawer over the page: picking any link,
  // even the current page's, should put the page back
  function handleClick(event) {
    if (isDrawerOpen && event.target.closest("a")) onCloseDrawer();
  }

  return (
    <aside className={className} onClick={handleClick} {...props}>
      <div className="sidebar-brand-row">
        {/* Signed-in users stay in the dashboard, so the logo goes to its home
            rather than the public landing page (which is for guests) */}
        <Link to="/dashboard/home" className="navbar-logo sidebar-brand">
          <LogoMark className="navbar-icon" />
          {/* The role under the name, in place of a separate title line */}
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-name">Manchester Event Portal</span>
            <span className="sidebar-brand-role">{roleLabel} dashboard</span>
          </span>
        </Link>
        <button
          ref={closeButtonRef}
          type="button"
          className="sidebar-close"
          onClick={onCloseDrawer}
          aria-label="Close menu"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <MainNav
        items={selectedUser.mainNav}
        counts={navCounts}
        activePath={activePath}
        pathname={pathname}
      />
      <SecondaryNav
        items={secondaryNav}
        counts={navCounts}
        helpTitle={helpNavTitle}
        helpItems={selectedUser.helpNav}
        activePath={activePath}
        pathname={pathname}
      />
      <UserNav items={selectedUser} onLogout={onLogout} />
    </aside>
  );
}
