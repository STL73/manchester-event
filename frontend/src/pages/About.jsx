import Button from "../components/UI/Button";
import HoneycombDivider from "../components/UI/HoneycombDivider";
import LogoMark from "../components/UI/LogoMark";
import PageFrame from "../components/UI/PageFrame";
import { aboutPageData } from "../data/aboutPageData";
import { eventCategories, eventLocations } from "../data/eventsData";

export default function About({ events, isUser, inDashboard = false }) {
  const { hero, dashboardHeading, story, process, stats, closing } = aboutPageData;
  const PromiseIcon = process.promise.icon;
  // Inside the dashboard, section headings look like every other dashboard page's
  const headingClass = inDashboard ? "dashboard-title" : "heading-section";
  const numbers = [
    { value: events.length, label: stats.events },
    { value: eventCategories.length, label: stats.categories },
    { value: eventLocations.length, label: stats.areas },
  ];

  return (
    <PageFrame
      inDashboard={inDashboard}
      hero={hero}
      heading={dashboardHeading}
      titleId="about-title"
      image={{ ...hero.image, width: 1920, height: 1280 }}
      className="about-page"
      bodyClassName="flex flex-col gap-12"
    >

      <section className="about-story" aria-labelledby="story-title">
        <div className="flex flex-col gap-5">
          <h2 className={headingClass} id="story-title">
            {story.title}
          </h2>
          {story.paragraphs.map((paragraph) => (
            <p className="content-p" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <div className="relative">
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

      <section className="flex flex-col gap-8" aria-labelledby="process-title">
        <h2 className={inDashboard ? headingClass : `${headingClass} about-heading-center`} id="process-title">
          {process.title}
        </h2>
        <ol className="about-steps">
          {process.steps.map(({ icon: Icon, title, text }, index) => (
            <li className="panel relative flex flex-col gap-3 pt-9" key={title}>
              <span className="about-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <Icon className="about-step-icon" aria-hidden="true" />
              <h3 className="heading-panel about-step-title">{title}</h3>
              <p className="about-step-text">{text}</p>
            </li>
          ))}
        </ol>
        <p className="about-promise">
          <PromiseIcon aria-hidden="true" />
          {process.promise.text}
        </p>
      </section>

      <section className="flex flex-col gap-8" aria-labelledby="stats-title">
        <h2 className="sr-only" id="stats-title">
          {stats.title}
        </h2>
        <dl className="about-stats">
          {numbers.map(({ value, label }) => (
            <div className="panel about-stat" key={label}>
              <dt className="group-label about-stat-label">{label}</dt>
              <dd className="about-stat-value">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* A pitch to explore or sign up: the dashboard's sidebar already
          links every page, so it's left out there */}
      {!inDashboard && (
        <section className="panel about-closing" aria-labelledby="closing-title">
          <div className="honeycomb-texture" aria-hidden="true" />
          <LogoMark className="about-closing-mark" />
          <h2 className="heading-section" id="closing-title">
            {closing.title}
          </h2>
          <p className="about-closing-text">{closing.text}</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
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
      )}
    </PageFrame>
  );
}
