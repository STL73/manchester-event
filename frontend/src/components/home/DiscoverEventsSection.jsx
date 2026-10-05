import Button from "../UI/Button";
import FeatureList from "./FeatureList";
import { homePageData } from "../../data/homePageData";

export default function DiscoverEventsSection() {
  const { discover } = homePageData;

  return (
    <section
      className="section-content"
      aria-labelledby="discover-events-title"
    >
      <h2 className="section-title" id="discover-events-title">
        {discover.title}
      </h2>
      <div className="content-container">
        <div className="content-wrapper">
          <FeatureList features={discover.features} />
          <Button to={discover.button.to} variant="primary" size="lg">
            {discover.button.label}
          </Button>
        </div>
        <div className="content-img-container">
          <img
            className="content-img"
            src={discover.image}
            alt={discover.imageAlt}
          />
        </div>
      </div>
    </section>
  );
}
