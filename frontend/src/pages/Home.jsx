import { Link } from "react-router-dom";
import Hero from "../components/home/Hero";
import WhatsOnSection from "../components/home/WhatsOnSection";
import Button from "../components/UI/Button";
import { homePageData } from "../data/homePageData";
import { eventCategories, eventLocations } from "../data/eventsData";
import { useApi } from "../lib/useApi";

// Counts to fall back on if the summary can't be loaded: the sections still
// show, with their links into Explore Events
const noCounts = { total: 0, when: {}, areas: {} };

// The shop window: a taste of what's on, and every section links into
// Explore Events with a filter already set
export default function Home() {
  const { areas, categories, audiences } = homePageData;
  const summary = useApi("/events/summary");
  const counts = summary.payload?.data ?? (summary.error ? noCounts : null);

  return (
    <div className="page home-page">
      <Hero />

      {/* Waits for the counts, so it opens on the right date range */}
      {counts && <WhatsOnSection counts={counts} />}

      <section className="home-section" aria-labelledby="areas-title">
        <h2 className="heading-section" id="areas-title">
          {areas.title}
        </h2>
        <ul className="area-tiles">
          {areas.tiles.map(({ id, image, position }) => {
            const total = counts?.areas[id] ?? 0;

            return (
              <li className="area-tile" key={id}>
                <img
                  className="area-tile-img"
                  src={image}
                  alt=""
                  loading="lazy"
                  style={position ? { objectPosition: position } : undefined}
                />
                <Link className="area-tile-link" to={`/events?location=${id}`}>
                  <span className="area-tile-name">
                    {eventLocations.find((location) => location.id === id).name}
                  </span>
                  {/* No count rather than a wrong "Nothing listed" if it failed */}
                  {summary.payload && <span className="area-tile-count">{areas.count(total)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="categories-title">
        <h2 className="heading-section" id="categories-title">
          {categories.title}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {eventCategories.map(({ id, name }) => (
            <li key={id}>
              <Link className="category-chip" to={`/events?category=${id}`}>
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-audiences" aria-label="Get involved">
        {audiences.map(({ icon: Icon, title, text, button }) => (
          <div className="panel home-audience" key={title}>
            <Icon className="home-audience-icon" aria-hidden="true" />
            <h2 className="heading-panel home-audience-title">{title}</h2>
            <p className="content-p">{text}</p>
            <Button to={button.to} variant="secondary" size="md">
              {button.label}
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
