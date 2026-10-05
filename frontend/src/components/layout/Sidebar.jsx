import { DroneIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
      {/* The way back to the public site, now the dashboard has no navbar */}
      <Link to="/" className="navbar-logo sidebar-brand">
        <DroneIcon className="navbar-icon" aria-hidden="true" />
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
