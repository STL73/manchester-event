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
  // Grows into spare height (the honeycomb takes it) but never below its links:
  // on a short screen the whole sidebar scrolls instead, rather than the links
  // scrolling in a box of their own
  return (
    <div className="sidebar-group flex-1 gap-0">
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
      {/* The dashboards' honeycomb: the empty space under the links, which
          is the one spot on every dashboard page with nothing to read */}
      <div className="sidebar-honeycomb" aria-hidden="true">
        <div className="honeycomb-texture" />
      </div>
    </div>
  );
}
