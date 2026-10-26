import { Info } from "lucide-react";
import PageFrame from "../components/UI/PageFrame";

// Privacy and Terms: same layout, content from data/legalPagesData.js
export default function LegalPage({ page, titleId, inDashboard = false }) {
  const { hero, dashboardHeading, updated, draftNote, sections } = page;
  // Inside the dashboard, section headings look like every other dashboard page's
  const headingClass = inDashboard ? "dashboard-title" : "heading-section reading-heading";

  return (
    <PageFrame
      inDashboard={inDashboard}
      hero={hero}
      heading={dashboardHeading}
      titleId={titleId}
      compact
      className="reading-page"
      bodyClassName="max-w-4xl self-start"
    >
      <article className="reading-column">
        <p className="reading-meta">{updated}</p>
        <p className="callout reading-note tone-accent">
          <Info aria-hidden="true" />
          {draftNote}
        </p>

        {sections.map(({ title, paragraphs }) => (
          <section className="flex flex-col gap-4" key={title}>
            <h2 className={headingClass}>{title}</h2>
            {paragraphs.map((paragraph) => (
              <p className="content-p" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </PageFrame>
  );
}
