import { LogOut } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { legalNav } from "../../data/navigationData";
import { Button } from "../UI/Button";
import Tooltip from "../UI/Tooltip";

// Who is signed in, at the bottom of the sidebar. Notifications and Settings
// sit just above in the secondary nav, so this only needs Log Out.
export default function UserNav({ items, onLogout }) {
  const Avatar = items.avatar;

  return (
    <div className="sidebar-user">
      <div className="sidebar-user-row">
        {/* A picture saved on Settings replaces the default icon */}
        {items.avatarUrl ? (
          <img className="sidebar-user-avatar sidebar-user-photo" src={items.avatarUrl} alt="" />
        ) : (
          <Avatar className="sidebar-user-avatar" aria-hidden="true" />
        )}
        <div className="sidebar-user-details">
          <p className="sidebar-user-name">{items.user}</p>
          <p className="sidebar-user-email">{items.email}</p>
        </div>
        <Tooltip text="Log out">
          <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out">
            <LogOut aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>
      <nav className="sidebar-legal" aria-label="About and legal">
        {legalNav.map((link, index) => (
          <Fragment key={link.url}>
            {index > 0 && <span aria-hidden="true">·</span>}
            <Link to={link.url} className="sidebar-legal-link">
              {link.title}
            </Link>
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
