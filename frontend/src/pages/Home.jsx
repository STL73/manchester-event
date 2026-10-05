import Hero from "../components/home/Hero";
import DiscoverEventsSection from "../components/home/DiscoverEventsSection";
import PlatformSection from "../components/home/PlatformSection";
import PreferencesSection from "../components/home/PreferencesSection";
import PromoteEventsSection from "../components/home/PromoteEventsSection";

export default function Home() {
  return (
    <div className="home-page">
      <Hero />
      <PromoteEventsSection />
      <DiscoverEventsSection />
      <PlatformSection />
      <PreferencesSection />
    </div>
  );
}
