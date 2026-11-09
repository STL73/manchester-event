import PageHero from "./PageHero";
import DashboardPageHeading from "../dashboard/DashboardPageHeading";

// A page that opens both publicly (under a hero) and in the dashboard (under the
// title row, the hero's intro as its summary, or `summary`; null for none)
export default function PageFrame({
  inDashboard = false,
  hero,
  heading,
  summary = hero.intro,
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
          <DashboardPageHeading id={titleId} icon={heading.icon} title={heading.title} summary={summary} />
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
