import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Settings2 } from "lucide-react";
import Button from "../components/UI/Button";
import StatusMessage from "../components/UI/StatusMessage";
import CategoryHoneycomb from "../components/dashboard/CategoryHoneycomb";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import { eventsPath, toEvent } from "../lib/publicEvents";
import { useApi } from "../lib/useApi";
import {
  preferenceCategories,
  preferencesForm,
  preferencesSummary,
  yourPicks,
} from "../data/preferencesData";

const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short" });

// An event has one category, so the events matching several are the sum of
// each one's count
function countFor(categoryIds, counts) {
  return categoryIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
}

// "2 interests · 14 upcoming events match them": what is saved, so it only
// changes on Save
function PreferencesSummary({ counts, interestIds }) {
  if (interestIds.length === 0) return preferencesSummary.none;

  const matching = countFor(interestIds, counts);
  return (
    <>
      <strong>
        {interestIds.length}{" "}
        {interestIds.length === 1 ? preferencesSummary.interest : preferencesSummary.interests}
      </strong>
      <span aria-hidden="true"> · </span>
      {matching} {preferencesSummary.matching}
    </>
  );
}

function sameIds(a, b) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

// Saved interests live in App, so the user dashboard counts the same ones
export default function Preferences({ interestIds, onSaveInterests }) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(interestIds);
  const [justSaved, setJustSaved] = useState(false);
  const [comingUpOpen, setComingUpOpen] = useState(false);
  const SubmitIcon = preferencesForm.submit.icon;

  // Upcoming events per category (GET /categories), keyed by slug
  const categories = useApi("/categories");
  const countByCategory = Object.fromEntries(
    (categories.payload?.data ?? []).map(({ slug, upcomingEvents }) => [slug, upcomingEvents]),
  );
  const matchingCount = countFor(selectedCategoryIds, countByCategory);
  // The next few in the picked categories, soonest first. Sorted, so picking
  // the same ones in another order asks for the same thing
  const comingUp = useApi(
    selectedCategoryIds.length > 0
      ? eventsPath({ category: [...selectedCategoryIds].sort(), limit: yourPicks.shownCount })
      : null,
  );
  const matchingEvents =
    selectedCategoryIds.length > 0 ? (comingUp.payload?.data.map(toEvent) ?? []) : [];
  const unchanged = sameIds(selectedCategoryIds, interestIds);
  const pickedCount = selectedCategoryIds.length;

  function toggleCategory(categoryId) {
    setJustSaved(false);
    setSelectedCategoryIds((currentIds) =>
      currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSaveInterests(selectedCategoryIds);
    setJustSaved(true);
  }

  return (
    <div className="dashboard-page">
      <section
        className="dashboard-section"
        aria-labelledby="my-preferences-title"
      >
        <DashboardPageHeading
          id="my-preferences-title"
          icon={Settings2}
          title="My Preferences"
          summary={<PreferencesSummary counts={countByCategory} interestIds={interestIds} />}
        />
        <form className="preferences-layout" onSubmit={handleSubmit}>
          <div className="panel contact-form-container preferences-picker">
            <fieldset className="contents">
              <legend className="heading-panel contact-form-title">{preferencesForm.title}</legend>
              <p className="content-p">{preferencesForm.description}</p>
              <CategoryHoneycomb
                categories={preferenceCategories}
                counts={countByCategory}
                selectedIds={selectedCategoryIds}
                onToggle={toggleCategory}
              />
            </fieldset>
          </div>

          {/* Beside the honeycomb on wide screens; a bar pinned above it on
              narrow ones, with the event list folded away (see App.css) */}
          <aside
            className="panel preferences-picks"
            aria-labelledby="your-picks-title"
            data-coming-up={comingUpOpen ? "open" : "closed"}
          >
            <div className="preferences-picks-head">
              <h2 className="heading-panel contact-form-title preferences-picks-title" id="your-picks-title">
                {yourPicks.title}
              </h2>
              <p className="preferences-picks-figures">
                {pickedCount === 0 ? (
                  yourPicks.nothing
                ) : (
                  <>
                    <strong>{pickedCount}</strong>{" "}
                    {pickedCount === 1 ? preferencesSummary.interest : preferencesSummary.interests}
                    <span aria-hidden="true"> · </span>
                    <strong>{matchingCount}</strong> {yourPicks.upcoming}
                  </>
                )}
              </p>
            </div>

            <div className="preferences-picks-actions">
              <Button type="submit" variant="primary" size="md" disabled={unchanged}>
                <SubmitIcon aria-hidden="true" />
                {preferencesForm.submit.label}
              </Button>
            </div>

            {justSaved && (
              <StatusMessage className="preferences-picks-saved">{preferencesForm.saved}</StatusMessage>
            )}

            <button
              type="button"
              className="preferences-coming-toggle"
              aria-expanded={comingUpOpen}
              aria-controls="preferences-coming-up"
              onClick={() => setComingUpOpen((open) => !open)}
            >
              {yourPicks.comingUp}
              <ChevronDown aria-hidden="true" />
            </button>

            <div className="preferences-coming" id="preferences-coming-up">
              <h3 className="group-label preferences-coming-title">{yourPicks.comingUp}</h3>
              {/* Counted by category, so "none" never shows while the list loads */}
              {pickedCount === 0 || (categories.payload && matchingCount === 0) ? (
                <p className="preferences-coming-empty">
                  {pickedCount === 0 ? yourPicks.pickFirst : yourPicks.noneComing}
                </p>
              ) : (
                <ul className="preferences-coming-list">
                  {matchingEvents.map((event) => {
                    const start = new Date(event.startDatetime);
                    return (
                      <li key={event.eventId}>
                        <Link className="preferences-coming-item" to={`/dashboard/events/${event.eventId}`}>
                          <span className="preferences-coming-date">
                            <span className="preferences-coming-day">{dayFormatter.format(start)}</span>
                            <span className="preferences-coming-month">{monthFormatter.format(start)}</span>
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="preferences-coming-name">{event.name}</span>
                            <span className="preferences-coming-location">{event.location}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </form>
      </section>
    </div>
  );
}
