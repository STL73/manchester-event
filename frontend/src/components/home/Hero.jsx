import Button from "../UI/Button";
import { homePageData } from "../../data/homePageData";

export default function Hero() {
  const { hero } = homePageData;

  return (
    <section className="section-content">
      <div className="hero-container">
        <div className="hero-wrapper">
          <h1 className="hero-title">
            Welcome to{" "}
            <span style={{ backgroundImage: `url(${hero.image})` }}>
              Manchester Event Portal
            </span>
          </h1>
          <p className="hero-sub">
            Your one-stop destination for all events in Manchester. Discover,
            follow and share events that match your interests.{" "}
          </p>
          <div className="hero-btn-box">
            <Button to="/events" variant="primary" size="lg">
              Explore Events
            </Button>
            <Button to="/auth/sign-up" variant="secondary" size="lg">
              Create Events
            </Button>
          </div>
        </div>
        <div className="hero-img-container">
          <img className="hero-img" src={hero.image} alt={hero.imageAlt} />
        </div>
      </div>
    </section>
  );
}
