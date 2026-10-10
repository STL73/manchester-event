import PageHero from "../components/UI/PageHero";
import EventsBrowser from "../components/events/EventsBrowser";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
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
        aria-labelledby="explore-events-title"
      >
        <DashboardPageHeading
          id="explore-events-title"
          icon={SectionIcon}
          title={exploreEventsSection.title}
          actions={exploreEventsActions}
        />
        <div className="dashboard-events-browser">{browser}</div>
      </section>
    </div>
  );
}
