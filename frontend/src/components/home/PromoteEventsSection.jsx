import Button from "../UI/Button";
import FeatureList from "./FeatureList";
import { homePageData } from "../../data/homePageData";

export default function PromoteEventsSection() {
  const { promote } = homePageData;

  return (
    <section className="section-content" aria-labelledby="promote-events-title">
      <h2 className="section-title" id="promote-events-title">
        {promote.title}
      </h2>
      <div className="content-container content-container-reversed">
        <div className="content-wrapper">
          <FeatureList features={promote.features} />
          <Button to={promote.button.to} variant="primary" size="lg">
            {promote.button.label}
          </Button>
        </div>
        <div className="content-img-container">
          <img
            className="content-img"
            src={promote.image}
            alt={promote.imageAlt}
          />
        </div>
      </div>
    </section>
  );
}
