import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import HoneycombDivider from "../UI/HoneycombDivider";
import LogoMark from "../UI/LogoMark";
import Tooltip from "../UI/Tooltip";
import { footerNav, footerText } from "../../data/navigationData";
import { socialLinks } from "../../data/socialLinks";
import manchesterFireworksNight from "../../images/events/manchester-fireworks-night.jpg";

function scrollToTop() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

// Public pages only. The honeycomb divider on its top edge gives every public
// page at least one honeycomb moment
export default function Footer() {
  return (
    <footer className="footer">
      <HoneycombDivider className="footer-divider" />

      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="navbar-logo">
            <LogoMark className="footer-icon" />
            <span>Manchester Event Portal</span>
          </Link>
          <p className="footer-tagline">{footerText.tagline}</p>
          {/* Placeholder addresses (#) until the real accounts exist */}
          <ul className="footer-socials" aria-label={footerText.socialsLabel}>
            {socialLinks.map(({ label, icon: Icon, href }) => (
              <li key={label}>
                <a href={href} aria-label={label} className="hex-button">
                  <Icon aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {footerNav.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="footer-title">{title}</h2>
            <ul className="footer-links">
              {links.map(({ title: linkTitle, url }) => (
                <li key={url}>
                  {/* Scrolls up too when only the filter changes, e.g.
                      Tonight to This weekend on Explore Events */}
                  <Link to={url} className="footer-link" onClick={() => window.scrollTo(0, 0)}>
                    {linkTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* The Home hero's photo-in-text, faded right down: the page starts
          and ends with the city's name */}
      <p
        className="footer-wordmark"
        style={{ backgroundImage: `url(${manchesterFireworksNight})` }}
        aria-hidden="true"
      >
        {footerText.wordmark}
      </p>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {footerText.rights}
        </p>
        <Tooltip text={footerText.backToTop}>
          <button type="button" className="hex-button" aria-label={footerText.backToTop} onClick={scrollToTop}>
            <ArrowUp aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </footer>
  );
}
