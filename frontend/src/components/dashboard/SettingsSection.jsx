// One Settings section: its title and a line of explanation beside the panel
// on wide screens, above it on narrow ones (layout A, decided 2026-10-11).
// `danger` gives the Delete section its red icon and border
export default function SettingsSection({ id, section, danger = false, children }) {
  const Icon = section.icon;

  return (
    <section className={`settings-row ${danger ? "is-danger" : ""}`} aria-labelledby={id}>
      <div className="settings-row-head">
        <h2 className="dashboard-title settings-row-title" id={id}>
          <Icon aria-hidden="true" />
          {section.title}
        </h2>
        <p className="settings-row-text">{section.description}</p>
      </div>
      <div className="panel settings-panel">{children}</div>
    </section>
  );
}
