import { Info } from "lucide-react";
import PageHero from "../components/UI/PageHero";

// Privacy and Terms: same layout, content from data/legalPagesData.js
export default function LegalPage({ page, titleId }) {
  const { hero, updated, draftNote, sections } = page;

  return (
    <div className="reading-page">
      <PageHero compact eyebrow={hero.eyebrow} title={hero.title} titleId={titleId} intro={hero.intro} />

      <article className="reading-column">
        <p className="reading-meta">{updated}</p>
        <p className="reading-note">
          <Info aria-hidden="true" />
          {draftNote}
        </p>

        {sections.map(({ title, paragraphs }) => (
          <section className="reading-section" key={title}>
            <h2 className="reading-heading">{title}</h2>
            {paragraphs.map((paragraph) => (
              <p className="content-p" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
