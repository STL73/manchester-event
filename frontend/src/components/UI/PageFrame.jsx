import PageHero from "./PageHero";
import DashboardPageHeading from "../dashboard/DashboardPageHeading";

// The public pages a signed-in person can also open from the sidebar (FAQs,
// Contact, About, Privacy, Terms). Public: the page column under a hero.
// Dashboard: the title row every dashboard page opens with, the hero's intro
// as its summary, and the content in `bodyClassName`
export default function PageFrame({
  inDashboard = false,
  hero,
  heading,
  titleId,
  image,
  compact = false,
  className = "",
  bodyClassName = "",
  children,
}) {
  if (inDashboard) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-section" aria-labelledby={titleId}>
          <DashboardPageHeading id={titleId} icon={heading.icon} title={heading.title} summary={hero.intro} />
          <div className={`w-full ${bodyClassName}`}>{children}</div>
        </section>
      </div>
    );
  }

  return (
    <div className={`page ${className}`}>
      <PageHero
        compact={compact}
        eyebrow={hero.eyebrow}
        title={hero.title}
        titleId={titleId}
        intro={hero.intro}
        image={image}
      />
      {children}
    </div>
  );
}
