import FeatureList from "./FeatureList";
import { homePageData } from "../../data/homePageData";

export default function PreferencesSection() {
  return (
    <section className="section-content" aria-labelledby="preferences-title">
      <h2 className="section-title" id="preferences-title">
        {homePageData.preferences.title}
      </h2>
      <div className="content-container content-container-stacked">
        <FeatureList
          features={homePageData.preferences.features}
          layout="row"
        />
      </div>
    </section>
  );
}
