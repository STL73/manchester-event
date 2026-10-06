import Button from "../components/UI/Button";
import HoneycombDivider from "../components/UI/HoneycombDivider";
import LogoMark from "../components/UI/LogoMark";
import { aboutPageData } from "../data/aboutPageData";
import { eventCategories, eventLocations } from "../data/eventsData";

export default function About({ events, isUser }) {
  const { hero, story, process, stats, closing } = aboutPageData;
  const PromiseIcon = process.promise.icon;
  const numbers = [
    { value: events.length, label: stats.events },
    { value: eventCategories.length, label: stats.categories },
    { value: eventLocations.length, label: stats.areas },
  ];

  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        {/* A real <img> rather than a CSS background, so it loads first and
            keeps its dimensions */}
        <img
          className="about-hero-img"
          src={hero.image.src}
          alt={hero.image.alt}
          width="1920"
          height="1280"
          fetchPriority="high"
        />
        <div className="honeycomb-texture" aria-hidden="true" />
        <div className="about-hero-content">
          <p className="about-eyebrow">{hero.eyebrow}</p>
          <h1 className="about-hero-title" id="about-title">
            {hero.title}
          </h1>
          <p className="about-hero-intro">{hero.intro}</p>
        </div>
      </section>

      <section className="about-section about-story" aria-labelledby="story-title">
        <div className="about-story-text">
          <h2 className="about-heading" id="story-title">
            {story.title}
          </h2>
          {story.paragraphs.map((paragraph) => (
            <p className="content-p" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <div className="about-story-media">
          <img
            className="about-story-img"
            src={story.image.src}
            alt={story.image.alt}
            width="1000"
            height="800"
            loading="lazy"
          />
          <img
            className="about-story-bee"
            src={story.bee.src}
            alt={story.bee.alt}
            width="600"
            height="628"
            loading="lazy"
          />
        </div>
      </section>

      <HoneycombDivider />

      <section className="about-section" aria-labelledby="process-title">
        <h2 className="about-heading about-heading-center" id="process-title">
          {process.title}
        </h2>
        <ol className="about-steps">
          {process.steps.map(({ icon: Icon, title, text }, index) => (
            <li className="about-step" key={title}>
              <span className="about-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <Icon className="about-step-icon" aria-hidden="true" />
              <h3 className="about-step-title">{title}</h3>
              <p className="about-step-text">{text}</p>
            </li>
          ))}
        </ol>
        <p className="about-promise">
          <PromiseIcon aria-hidden="true" />
          {process.promise.text}
        </p>
      </section>

      <section className="about-section" aria-labelledby="stats-title">
        <h2 className="sr-only" id="stats-title">
          {stats.title}
        </h2>
        <dl className="about-stats">
          {numbers.map(({ value, label }) => (
            <div className="about-stat" key={label}>
              <dt className="about-stat-label">{label}</dt>
              <dd className="about-stat-value">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="about-closing" aria-labelledby="closing-title">
        <div className="honeycomb-texture" aria-hidden="true" />
        <LogoMark className="about-closing-mark" />
        <h2 className="about-heading" id="closing-title">
          {closing.title}
        </h2>
        <p className="about-closing-text">{closing.text}</p>
        <div className="about-closing-actions">
          <Button to={closing.explore.to} variant="primary" size="lg">
            {closing.explore.label}
          </Button>
          {/* Signed-in users already have an account */}
          {!isUser && (
            <Button to={closing.signUp.to} variant="secondary" size="lg">
              {closing.signUp.label}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
