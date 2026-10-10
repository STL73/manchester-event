import NavItem from "./NavItem";

export default function MainNav({ items, activePath, pathname }) {
  return (
    <div className="sidebar-group sidebar-group-main">
      <p className="sidebar-title">
        <span className="capitalize pr-2">{items.type}</span> Dashboard
      </p>
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
      {/* The dashboards' honeycomb: the empty space under the links, which
          is the one spot on every dashboard page with nothing to read */}
      <div className="sidebar-honeycomb" aria-hidden="true">
        <div className="honeycomb-texture" />
      </div>
    </div>
  );
}
