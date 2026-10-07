import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
  const { pathname } = useLocation();
  // Below lg the links and buttons fold into a drop-down panel
  const [menuOpen, setMenuOpen] = useState(false);

  // From lg up one pill sits behind the current page's link and glides to
  // whichever link is hovered or focused. Null hides it (no current link).
  const linksRef = useRef(null);
  const [pill, setPill] = useState(null);

  const placePill = useCallback((link) => {
    setPill((previous) =>
      link
        ? // No glide the first time, so it doesn't slide in from the left edge
          { left: link.offsetLeft, width: link.offsetWidth, glide: previous !== null }
        : null,
    );
  }, []);

  const restPill = useCallback(() => {
    placePill(linksRef.current?.querySelector(".navbar-link.is-active"));
  }, [placePill]);

  // The observer fires once on observe, so this also places the pill after
  // every page change, and again whenever the links change size
  useEffect(() => {
    const observer = new ResizeObserver(restPill);
    observer.observe(linksRef.current);
    return () => observer.disconnect();
  }, [restPill, pathname, isUser]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  // Any link or button in the panel navigates, so the panel shouldn't stay
  // open over the next page
  function closeAfterChoice(event) {
    if (event.target.closest("a, button")) setMenuOpen(false);
  }

  function handleLinksBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) restPill();
  }

  return (
    <>
      <nav className="navbar" {...props}>
        <div className="navbar-container">
          <Link to={isUser ? "/dashboard/home" : "/"} className="navbar-logo" onClick={() => setMenuOpen(false)}>
            <LogoMark className="navbar-icon" />
            <span>Manchester Event Portal</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="text-foreground lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="navbar-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-6!" aria-hidden="true" /> : <Menu className="size-6!" aria-hidden="true" />}
          </Button>

          {/* One set of links: inline from lg up, a drop-down panel below it */}
          <div id="navbar-menu" className={`navbar-menu ${menuOpen ? "is-open" : ""}`} onClick={closeAfterChoice}>
            <div className="navbar-links" ref={linksRef} onMouseLeave={restPill} onBlur={handleLinksBlur}>
              <span
                className={`navbar-pill ${pill ? "is-visible" : ""} ${pill?.glide ? "is-gliding" : ""}`}
                style={pill ? { width: pill.width, transform: `translateX(${pill.left}px)` } : undefined}
                aria-hidden="true"
              />
              {/* NavLink marks the current page (and /events/:id) as active */}
              {navLinks.map(({ title, url, end }) => (
                <NavLink
                  key={url}
                  to={url}
                  end={end}
                  className={navLinkClass}
                  onMouseEnter={(event) => placePill(event.currentTarget)}
                  onFocus={(event) => placePill(event.currentTarget)}
                >
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

      {/* Test control until real login exists. Development builds only, so
          it can never reach production by accident. Outside <nav>: the
          navbar's backdrop blur would pin a fixed child to the navbar */}
      {import.meta.env.DEV && (
        <div className="dev-role-badge">
          <Button variant="secondary" size="sm" onClick={onToggleUserMode}>
            User mode: {isUser ? "true" : "false"}
          </Button>
        </div>
      )}
    </>
  );
}
