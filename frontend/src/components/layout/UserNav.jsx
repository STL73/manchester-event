import { LogOut } from "lucide-react";
import { Button } from "../UI/Button";
import Tooltip from "../UI/Tooltip";

// Who is signed in, at the bottom of the sidebar. Notifications and Settings
// sit just above in the secondary nav, so this only needs Log Out.
export default function UserNav({ items, onLogout, onSwitchUserType }) {
  const Avatar = items.avatar;

  return (
    <div className="sidebar-user">
      <div className="sidebar-user-row">
        <Avatar className="sidebar-user-avatar" aria-hidden="true" />
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
      {/* Test control until real login exists: cycles user / organiser / admin */}
      {/* Wrapper carries the class: Button's own display utility would beat it */}
      <div className="sidebar-test-role">
        <Button variant="secondary" size="sm" className="w-full" onClick={onSwitchUserType}>
          Test role: {items.type}
        </Button>
      </div>
    </div>
  );
}
