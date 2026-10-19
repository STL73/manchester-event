import { Link } from "react-router-dom";

// A link counts as active on its own page and on its sub-pages
// (e.g. Manage Users stays active on /manage-users/23/edit)
function matches(path, url) {
  return path === url || path.startsWith(`${url}/`);
}

export default function NavItem({ item, counts, activePath, pathname }) {
  const isActive = matches(activePath, item.url);
  // aria-current only when this really is the page shown, not the "came from" page
  const isCurrentPage = matches(pathname, item.url);
  const count = item.badge ? (counts?.[item.badge.count] ?? 0) : 0;

  return (
    <Link
      to={item.url}
      className="sidebar-link"
      aria-current={isCurrentPage ? "page" : undefined}
    >
      <div className={`menu-item ${isActive ? "is-active" : ""}`}>
        {item.icon && <item.icon className="menu-icon" aria-hidden="true" />}
        {/* The label is also the icon rail's tooltip, so the count's words
            for screen readers live inside it */}
        <span className="menu-label">
          {item.title}
          {count > 0 && (
            <span className="sr-only">
              {" "}
              ({count} {item.badge.label})
            </span>
          )}
        </span>
        {count > 0 && (
          <span
            className={`nav-badge tone-${item.badge.tone ?? "accent"}`}
            aria-hidden="true"
          >
            {count}
          </span>
        )}
      </div>
    </Link>
  );
}
