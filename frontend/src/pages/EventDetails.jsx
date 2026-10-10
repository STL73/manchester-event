import { CalendarDays, MapPin, Tag } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import { eventDetailsPage } from "../data/eventsData";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Image and details, shared by the full-screen and dashboard versions
function EventDetailsBody({ event, TitleTag, titleId }) {
  return (
    <>
      <div className="event-details-image-container">
        <img
          className="event-details-image"
          src={event.image}
          alt={event.name}
          style={{ objectPosition: event.imagePosition }}
        />
      </div>
      <div className="event-details-content">
        <p className="event-card-category">
          <Tag className="event-card-icon" aria-hidden="true" />
          {event.category}
        </p>
        <TitleTag className="section-title" id={titleId}>
          {event.name}
        </TitleTag>
        <p className="event-card-detail">
          <MapPin className="event-card-icon" aria-hidden="true" />
          {event.location}
        </p>
        <p className="event-card-detail">
          <CalendarDays className="event-card-icon" aria-hidden="true" />
          {dateFormatter.format(new Date(event.startDatetime))}
        </p>
      </div>
    </>
  );
}

// `events` is the master list in the dashboard (any event can be viewed)
// and only the approved events on the public /events/:id page
export default function EventDetails({ events, inDashboard = false }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const event = events.find((item) => String(item.eventId) === eventId);
  const { dashboardTitle, titleIcon: TitleIcon, goBack } = eventDetailsPage;

  function handleGoBack() {
    // "default" means this is the first page in the tab's history
    if (location.key === "default") navigate(eventDetailsPage.goBackFallback);
    else navigate(-1);
  }

  // Inside the dashboard: same layout as the edit pages, with Go Back
  if (inDashboard) {
    return (
      <div className="dashboard-home">
        <section
          className="dashboard-section"
          aria-labelledby="event-details-heading"
        >
          <DashboardPageHeading
            id="event-details-heading"
            icon={TitleIcon}
            title={dashboardTitle}
          >
            <Button type="button" variant="primary" size="sm" onClick={handleGoBack}>
              <goBack.icon aria-hidden="true" />
              {goBack.label}
            </Button>
          </DashboardPageHeading>

          {event ? (
            <div className="event-details-body">
              <EventDetailsBody
                event={event}
                TitleTag="h3"
                titleId="event-details-title"
              />
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <p className="dashboard-empty-text">{eventDetailsPage.notFound}</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!event) {
    return (
      <section className="section-content">
        <h1 className="section-title">Event not found</h1>
        <Button to="/events" variant="primary" size="md">
          Back to Events
        </Button>
      </section>
    );
  }

  // No <main> of its own: App already wraps every page in one
  return (
    <section
      className="section-content event-details-page"
      aria-labelledby="event-details-title"
    >
      <EventDetailsBody event={event} TitleTag="h1" titleId="event-details-title" />
      <div className="event-details-content">
        <Link className="event-details-back" to="/events">
          Back to all events
        </Link>
      </div>
    </section>
  );
}
