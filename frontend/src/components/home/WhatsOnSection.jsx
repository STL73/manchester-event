import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Button from "../UI/Button";
import EventCard from "../events/EventCard";
import { homePageData } from "../../data/homePageData";
import { whenOptions } from "../../data/exploreEventsData";
import { bySoonest, matchesWhen } from "../../lib/eventDates";

function explorePath(when) {
  return when ? `/events?when=${when}` : "/events";
}

// `events` are upcoming only. Opens on the soonest range that has anything
// in it, so the first thing a visitor sees isn't an empty list
export default function WhatsOnSection({ events, now }) {
  const { whatsOn } = homePageData;
  const [when, setWhen] = useState(
    () =>
      whenOptions.find(({ id }) => id && events.some((event) => matchesWhen(event, id, now)))
        ?.id ?? "",
  );

  const matching = events.filter((event) => matchesWhen(event, when, now)).sort(bySoonest);
  const shown = matching.slice(0, whatsOn.limit);

  return (
    <section className="home-section" aria-labelledby="whats-on-title">
      <div className="home-section-header">
        <h2 className="home-heading" id="whats-on-title">
          {whatsOn.title}
        </h2>
        {matching.length > whatsOn.limit && (
          <Button to={explorePath(when)} variant="link" size="sm">
            {whatsOn.seeAll(matching.length)}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="events-when" role="group" aria-label="When">
        {whenOptions.map(({ id, label }) => (
          <button className={`events-when-option ${when === id ? "is-active" : ""}`} type="button" aria-pressed={when === id} onClick={() => setWhen(id)} key={id || "any"}>
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="events-empty-state">
          <p className="content-p">{whatsOn.empty}</p>
          <Button to="/events" variant="link" size="sm">
            {whatsOn.emptyLink}
          </Button>
        </div>
      ) : (
        <div className="events-grid events-grid-three">
          {shown.map((event) => (
            <EventCard key={event.eventId} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
