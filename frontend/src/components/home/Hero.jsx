import { useNavigate } from "react-router-dom";
import Button from "../UI/Button";
import { homePageData } from "../../data/homePageData";

// Seconds each photo stays in the letters; .home-hero-word's keyframes are
// written for four photos at this pace
const PHOTO_SECONDS = 4;

export default function Hero() {
  const { hero } = homePageData;
  const { search } = hero;
  const SearchIcon = search.button.icon;
  const navigate = useNavigate();
  const cycle = hero.images.length * PHOTO_SECONDS;

  // Keywords only: the full search with date, category and area is on
  // Explore Events, which opens with these keywords filled in
  function handleSubmit(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q").trim();
    navigate(query ? `/events?${new URLSearchParams({ q: query })}` : "/events");
  }

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="honeycomb-texture" aria-hidden="true" />

      <h1 id="home-title">
        <span className="sr-only">{hero.title}</span>
        {/* One copy of the word per photo, stacked and crossfading. Negative
            delays start each one part-way through its cycle, so the first
            photo shows straight away and the rest follow in order */}
        <span className="home-hero-word" aria-hidden="true">
          {hero.images.map((image, index) => (
            <span
              key={image}
              style={{
                backgroundImage: `url(${image})`,
                animationDuration: `${cycle}s`,
                animationDelay: `${-((cycle - index * PHOTO_SECONDS) % cycle)}s`,
              }}
            >
              {hero.word}
            </span>
          ))}
        </span>
      </h1>

      <div className="home-hero-sub">
        <p className="home-hero-name" aria-hidden="true">
          {hero.name}
        </p>
        <p className="home-hero-intro">{hero.intro}</p>
      </div>

      <form className="home-search" role="search" aria-label={search.label} onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="home-search-input">
          {search.label}
        </label>
        <input
          id="home-search-input"
          className="events-search-input"
          name="q"
          type="search"
          placeholder={search.placeholder}
        />
        <Button type="submit" variant="primary" size="md" className="rounded-lg!">
          <SearchIcon aria-hidden="true" />
          {search.button.label}
        </Button>
      </form>
    </section>
  );
}
