import { DroneIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../UI/Button";
import { publicNav } from "../../data/navigationData";

function navLinkClass({ isActive }) {
  return `navbar-link ${isActive ? "is-active" : ""}`;
}

// Public pages only. Signed in, it matches header.php: the public links plus
// Dashboard and Log Out (the user's details live in the dashboard sidebar)
export default function Navbar({ isUser, onToggleUserMode, ...props }) {
  return (
    <nav className="navbar" {...props}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <DroneIcon className="navbar-icon" />
          <span>Manchester Event Portal</span>
        </Link>
        <Button variant="secondary" size="sm" onClick={onToggleUserMode}>
          User mode: {isUser ? "true" : "false"}
        </Button>
        <div className="navbar-links">
          {/* NavLink marks the current page (and /events/:id) as active */}
          {publicNav.map(({ title, url, end }) => (
            <NavLink key={url} to={url} end={end} className={navLinkClass}>
              {title}
            </NavLink>
          ))}
          {isUser && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </div>

        <div className="navbar-auth">
          {isUser ? (
            <Button variant="ghost" size="sm" onClick={onToggleUserMode}>
              Log Out
            </Button>
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
