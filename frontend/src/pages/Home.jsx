import { useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/home/Hero";
import WhatsOnSection from "../components/home/WhatsOnSection";
import Button from "../components/UI/Button";
import { homePageData } from "../data/homePageData";
import { eventCategories, eventLocations } from "../data/eventsData";
import { isUpcoming } from "../lib/eventDates";

// The shop window: a taste of what's on, and every section links into
// Explore Events with a filter already set
export default function Home({ events }) {
  const { areas, categories, audiences } = homePageData;
  // Fixed when the page opens, as on Explore Events
  const [now] = useState(() => new Date());
  const upcoming = events.filter((event) => isUpcoming(event, now));

  return (
    <div className="home-page">
      <Hero />

      <WhatsOnSection events={upcoming} now={now} />

      <section className="home-section" aria-labelledby="areas-title">
        <h2 className="home-heading" id="areas-title">
          {areas.title}
        </h2>
        <ul className="area-tiles">
          {areas.tiles.map(({ id, image, position }) => {
            const total = upcoming.filter((event) => event.locationId === id).length;

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
                  <span className="area-tile-count">{areas.count(total)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="categories-title">
        <h2 className="home-heading" id="categories-title">
          {categories.title}
        </h2>
        <ul className="category-chips">
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
          <div className="home-audience" key={title}>
            <Icon className="home-audience-icon" aria-hidden="true" />
            <h2 className="home-audience-title">{title}</h2>
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
