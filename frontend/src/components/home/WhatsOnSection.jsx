import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Button from "../UI/Button";
import EventCard from "../events/EventCard";
import { homePageData } from "../../data/homePageData";
import { whenOptions } from "../../data/exploreEventsData";
import { eventsPath, toEvent } from "../../lib/publicEvents";
import { useApi } from "../../lib/useApi";

function explorePath(when) {
  return when ? `/events?when=${when}` : "/events";
}

// `counts` is GET /events/summary: the total and one count per date range.
// Opens on the soonest range that has anything in it, so the first thing a
// visitor sees isn't an empty list
export default function WhatsOnSection({ counts }) {
  const { whatsOn } = homePageData;
  const [chosen, setChosen] = useState(null);
  const when = chosen ?? whenOptions.find(({ id }) => id && counts.when[id] > 0)?.id ?? "";
  const total = when ? counts.when[when] : counts.total;

  const { payload, error, loading } = useApi(eventsPath({ when, limit: whatsOn.limit }));
  const shown = payload?.data.map(toEvent) ?? [];

  return (
    <section className="home-section" aria-labelledby="whats-on-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="heading-section" id="whats-on-title">
          {whatsOn.title}
        </h2>
        {total > whatsOn.limit && (
          <Button to={explorePath(when)} variant="link" size="sm">
            {whatsOn.seeAll(total)}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="events-when" role="group" aria-label="When">
        {whenOptions.map(({ id, label }) => (
          <button className={`pill events-when-option ${when === id ? "is-active" : ""}`} type="button" aria-pressed={when === id} onClick={() => setChosen(id)} key={id || "any"}>
            {label}
          </button>
        ))}
      </div>

      {/* The last cards stay while the next range loads, so the row doesn't jump */}
      {error || (payload && shown.length === 0) ? (
        <div className="events-empty-state">
          <p className="content-p">{error ? whatsOn.loadError : whatsOn.empty}</p>
          <Button to="/events" variant="link" size="sm">
            {whatsOn.emptyLink}
          </Button>
        </div>
      ) : (
        <div className="events-grid events-grid-three" aria-busy={loading}>
          {shown.map((event) => (
            <EventCard key={event.eventId} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
