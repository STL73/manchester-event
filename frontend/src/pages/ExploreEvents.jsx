import { Zap } from "lucide-react";
import Button from "../components/UI/Button";
import PageHero from "../components/UI/PageHero";
import EventsBrowser from "../components/events/EventsBrowser";
import {
  exploreEventsActions,
  exploreEventsSection,
  publicIntro,
} from "../data/exploreEventsData";

// One page, two layouts: the public /events page and the dashboard
// Explore Events page share the search, layout switcher and cards.
export default function ExploreEvents({
  inDashboard = false,
  events,
  selectedUser,
  favouriteIds,
  onToggleFavourite,
}) {
  const browser = (
    <EventsBrowser
      events={events}
      canFavourite={inDashboard && selectedUser?.type === "user"}
      favouriteIds={favouriteIds}
      onToggleFavourite={onToggleFavourite}
    />
  );

  if (!inDashboard) {
    return (
      <div className="explore-page">
        <PageHero
          compact
          eyebrow={publicIntro.eyebrow}
          title={publicIntro.title}
          titleId="events-title"
          intro={publicIntro.text}
          image={publicIntro.image}
        />
        {browser}
      </div>
    );
  }

  const SectionIcon = exploreEventsSection.icon;

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-actions-title"
      >
        <h2 className="dashboard-title" id="quick-actions-title">
          <Zap className="dashboard-title-icon" aria-hidden="true" />
          Quick Actions
        </h2>
        <div className="dashboard-actions">
          {exploreEventsActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="explore-events-title"
      >
        <h2 className="dashboard-title" id="explore-events-title">
          <SectionIcon className="dashboard-title-icon" aria-hidden="true" />
          {exploreEventsSection.title}
        </h2>
        <div className="dashboard-events-browser">{browser}</div>
      </section>
    </div>
  );
}
