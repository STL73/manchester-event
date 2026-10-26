import NavItem from "./NavItem";

// Runs of links that share a `section` go under one small label
function groupBySection(items) {
  return items.reduce((groups, item) => {
    const last = groups.at(-1);
    if (last && last.section === item.section) {
      return [...groups.slice(0, -1), { ...last, items: [...last.items, item] }];
    }
    return [...groups, { section: item.section, items: [item] }];
  }, []);
}

export default function MainNav({ items, counts, activePath, pathname }) {
  // Grows into spare height but never below its links: on a short screen the
  // whole sidebar scrolls instead, rather than the links scrolling in a box of
  // their own. The links stay at the top; the honeycomb fills the box behind them
  return (
    <div className="sidebar-group relative isolate flex-1 justify-start gap-0">
      {groupBySection(items).map(({ section, items: sectionItems }) => (
        <div key={section ?? "top"}>
          {section && <p className="group-label sidebar-section-label">{section}</p>}
          <div className="sidebar-menu">
            {sectionItems.map((item) => (
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
      ))}
      {/* The dashboards' honeycomb, faint behind the page links, so every
          role sees it whatever the number of links or the window's height */}
      <div className="sidebar-honeycomb" aria-hidden="true">
        <div className="honeycomb-texture" />
      </div>
    </div>
  );
}
