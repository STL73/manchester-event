import { Link, useLocation } from "react-router-dom";
import LogoMark from "../UI/LogoMark";
import MainNav from "./MainNav";
import SecondaryNav from "./SecondaryNav";
import UserNav from "./UserNav";

export default function Sidebar({
  selectedUser,
  secondaryNav,
  isCollapsed,
  onLogout,
  onSwitchUserType,
  ...props
}) {
  const { pathname, state } = useLocation();
  // Event details and Edit Event highlight the page they were opened from
  // (sent by the View and Edit links)
  const opensFromAnotherPage =
    pathname.startsWith("/dashboard/events/") ||
    (pathname.startsWith("/dashboard/my-events/") && pathname.endsWith("/edit"));
  const activePath = opensFromAnotherPage && state?.from ? state.from : pathname;

  return (
    <aside
      className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}
      {...props}
    >
      {/* Signed-in users stay in the dashboard, so the logo goes to its home
          rather than the public landing page (which is for guests) */}
      <Link to="/dashboard/home" className="navbar-logo sidebar-brand">
        <LogoMark className="navbar-icon" />
        <span>Manchester Event Portal</span>
      </Link>
      <MainNav items={selectedUser} activePath={activePath} pathname={pathname} />
      <SecondaryNav
        items={secondaryNav}
        activePath={activePath}
        pathname={pathname}
      />
      <UserNav
        items={selectedUser}
        onLogout={onLogout}
        onSwitchUserType={onSwitchUserType}
      />
    </aside>
  );
}
