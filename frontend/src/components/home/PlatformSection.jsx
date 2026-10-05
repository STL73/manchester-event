import FeatureList from "./FeatureList";
import { homePageData } from "../../data/homePageData";

export default function PlatformSection() {
  return (
    <section className="section-content" aria-labelledby="platform-title">
      <h2 className="section-title" id="platform-title">
        {homePageData.platform.title}
      </h2>
      <div className="content-container content-container-stacked">
        <FeatureList features={homePageData.platform.features} layout="row" />
      </div>
    </section>
  );
}
