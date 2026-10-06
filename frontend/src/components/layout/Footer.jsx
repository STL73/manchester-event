import { Link } from "react-router-dom";
import LogoMark from "../UI/LogoMark";
import { footerNav } from "../../data/navigationData";
import { socialLinks } from "../../data/socialLinks";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <Link to="/" className="navbar-logo">
            <LogoMark className="navbar-icon" />
            <span>Manchester Event Portal</span>
          </Link>
          <p className="footer-tagline">
            Experience the events that suit your needs!
          </p>
        </div>

        {footerNav.map(({ title, links }) => (
          <div key={title} className="footer-column">
            <h3 className="footer-title">{title}</h3>
            {links.map(({ title, url }) => (
              <Link key={url} to={url} className="footer-link">
                {title}
              </Link>
            ))}
          </div>
        ))}

        <div className="footer-column">
          <h3 className="footer-title">Follow Us</h3>
          <div className="footer-socials">
            {socialLinks.map(({ label, icon: Icon, href }) => (
              <a key={label} href={href} aria-label={label} className="footer-social">
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="footer-copyright">
        © {new Date().getFullYear()} Manchester Event Portal. All rights reserved.
      </p>
    </footer>
  );
}
