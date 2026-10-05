import NavItem from "./NavItem";

export default function SecondaryNav({ items, activePath, pathname }) {
  return (
    <div className="sidebar-group sidebar-group-secondary">
      <div className="sidebar-menu border-t-3 border-border">
        {items.map((item) => (
          <NavItem
            key={item.title}
            item={item}
            activePath={activePath}
            pathname={pathname}
          />
        ))}
      </div>
    </div>
  );
}
