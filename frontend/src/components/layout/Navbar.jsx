import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import LogoMark from "../UI/LogoMark";
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
  // Below xl the links and buttons fold into a drop-down panel
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  // Any link or button in the panel either navigates or changes the role,
  // so the panel shouldn't stay open over the result
  function closeAfterChoice(event) {
    if (event.target.closest("a, button")) setMenuOpen(false);
  }

  return (
    <nav className="navbar" {...props}>
      <div className="navbar-container">
        <Link to={isUser ? "/dashboard/home" : "/"} className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <LogoMark className="navbar-icon" />
          <span>Manchester Event Portal</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="text-foreground xl:hidden"
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-6!" aria-hidden="true" /> : <Menu className="size-6!" aria-hidden="true" />}
        </Button>

        {/* One set of links: inline from xl up, a drop-down panel below it */}
        <div id="navbar-menu" className={`navbar-menu ${menuOpen ? "is-open" : ""}`} onClick={closeAfterChoice}>
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
      </div>
    </nav>
  );
}
