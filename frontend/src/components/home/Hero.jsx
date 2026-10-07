import { useNavigate } from "react-router-dom";
import Button from "../UI/Button";
import { homePageData } from "../../data/homePageData";

export default function Hero() {
  const { hero } = homePageData;
  const { search } = hero;
  const SearchIcon = search.button.icon;
  const navigate = useNavigate();

  // Keywords only: the full search with date, category and area is on
  // Explore Events, which opens with these keywords filled in
  function handleSubmit(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q").trim();
    navigate(query ? `/events?${new URLSearchParams({ q: query })}` : "/events");
  }

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-text">
        <h1 className="home-hero-title" id="home-title">
          {hero.titleLead}{" "}
          <span style={{ backgroundImage: `url(${hero.image})` }}>{hero.title}</span>
        </h1>
        <p className="home-hero-intro">{hero.intro}</p>

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
      </div>

      <div className="home-hero-media">
        <img
          className="home-hero-img"
          src={hero.image}
          alt={hero.imageAlt}
          width="1200"
          height="1600"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}
