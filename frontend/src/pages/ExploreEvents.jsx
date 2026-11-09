import PageFrame from "../components/UI/PageFrame";
import EventsBrowser from "../components/events/EventsBrowser";
import {
  exploreEventsSection,
  publicIntro,
} from "../data/exploreEventsData";

// Explore Events, public and in the dashboard. The dashboard's has no summary:
// the intro speaks to guests, and the results line gives the count
export default function ExploreEvents({
  inDashboard = false,
  selectedUser,
  favouriteIds,
  onToggleFavourite,
}) {
  return (
    <PageFrame
      inDashboard={inDashboard}
      hero={publicIntro}
      heading={exploreEventsSection}
      summary={null}
      titleId={inDashboard ? "explore-events-title" : "events-title"}
      image={publicIntro.image}
      compact
      bodyClassName="flex flex-col items-center gap-6"
    >
      <EventsBrowser
        canFavourite={inDashboard && selectedUser?.type === "user"}
        favouriteIds={favouriteIds}
        onToggleFavourite={onToggleFavourite}
      />
    </PageFrame>
  );
}
