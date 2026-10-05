import NavItem from "./NavItem";

export default function MainNav({ items, activePath, pathname }) {
  return (
    <div className="sidebar-group sidebar-group-main">
      <h1 className="sidebar-title">
        <span className="capitalize pr-2">{items.type}</span> Dashboard
      </h1>
      <div className="sidebar-menu border-t-3 border-border">
        {items.mainNav.map((item) => (
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
