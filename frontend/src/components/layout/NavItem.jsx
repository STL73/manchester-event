import { Link } from "react-router-dom";

// A link counts as active on its own page and on its sub-pages
// (e.g. Manage Users stays active on /manage-users/23/edit)
function matches(path, url) {
  return path === url || path.startsWith(`${url}/`);
}

export default function NavItem({ item, activePath, pathname }) {
  const isActive = matches(activePath, item.url);
  // aria-current only when this really is the page shown, not the "came from" page
  const isCurrentPage = matches(pathname, item.url);

  return (
    <Link
      to={item.url}
      className="sidebar-link"
      aria-current={isCurrentPage ? "page" : undefined}
    >
      <div className={`menu-item ${isActive ? "is-active" : ""}`}>
        {item.icon && <item.icon className="menu-icon" />}
        <span>{item.title}</span>
      </div>
    </Link>
  );
}
