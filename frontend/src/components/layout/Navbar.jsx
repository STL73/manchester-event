import { DroneIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../UI/Button";
import { publicNav } from "../../data/navigationData";

function navLinkClass({ isActive }) {
  return `navbar-link ${isActive ? "is-active" : ""}`;
}

// Public pages only; the dashboard has its own sidebar instead. Signed in,
// Dashboard and Log Out take the place of Log In and Sign Up, so a signed-in
// user who lands here has a way back. Guest-only links (Home) are hidden
// rather than left to redirect
export default function Navbar({ isUser, onToggleUserMode, ...props }) {
  const navLinks = isUser ? publicNav.filter((link) => !link.guestOnly) : publicNav;

  return (
    <nav className="navbar" {...props}>
      <div className="navbar-container">
        <Link to={isUser ? "/dashboard/home" : "/"} className="navbar-logo">
          <DroneIcon className="navbar-icon" />
          <span>Manchester Event Portal</span>
        </Link>
        <Button variant="secondary" size="sm" onClick={onToggleUserMode}>
          User mode: {isUser ? "true" : "false"}
        </Button>
        <div className="navbar-links">
          {/* NavLink marks the current page (and /events/:id) as active */}
          {navLinks.map(({ title, url, end }) => (
            <NavLink key={url} to={url} end={end} className={navLinkClass}>
              {title}
            </NavLink>
          ))}
        </div>

        <div className="navbar-auth">
          {isUser ? (
            <>
              <Button to="/dashboard/home" size="sm">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleUserMode}>
                Log Out
              </Button>
            </>
          ) : (
            <>
              {/* Button renders the link itself: one element, one Tab stop */}
              <Button to="/auth/login" variant="ghost" size="sm">
                Log In
              </Button>
              <Button to="/auth/sign-up" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
