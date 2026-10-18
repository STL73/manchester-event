import HelpMenu from "./HelpMenu";
import NavItem from "./NavItem";

// Help (when the role has help links) sits with Notifications and Settings
export default function SecondaryNav({
  items,
  counts,
  helpTitle,
  helpItems = [],
  activePath,
  pathname,
}) {
  return (
    <div className="sidebar-group sidebar-group-secondary">
      <div className="sidebar-menu">
        {helpItems.length > 0 && <HelpMenu title={helpTitle} items={helpItems} />}
        {items.map((item) => (
          <NavItem
            key={item.title}
            item={item}
            counts={counts}
            activePath={activePath}
            pathname={pathname}
          />
        ))}
      </div>
    </div>
  );
}
