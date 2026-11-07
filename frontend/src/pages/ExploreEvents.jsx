import PageFrame from "../components/UI/PageFrame";
import EventsBrowser from "../components/events/EventsBrowser";
import {
  exploreEventsSection,
  publicIntro,
} from "../data/exploreEventsData";

// One page, two layouts: the public /events page and the dashboard
// Explore Events page share the search, layout switcher and cards. The
// dashboard's has no summary: the intro speaks to guests, and the results
// line under the filters already gives the count
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
