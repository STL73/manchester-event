import { useState } from "react";
import { Settings2 } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import { isUpcoming } from "../lib/eventDates";
import {
  preferenceCategories,
  preferencesForm,
  preferencesSummary,
} from "../data/preferencesData";

// "2 interests · 14 upcoming events match them"
function PreferencesSummary({ events, interestIds }) {
  if (interestIds.length === 0) return preferencesSummary.none;

  const now = new Date();
  const matching = events.filter(
    (event) => interestIds.includes(event.categoryId) && isUpcoming(event, now),
  ).length;
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

// Saved interests live in App, so the user dashboard counts the same ones
export default function Preferences({ events, interestIds, onSaveInterests }) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(interestIds);
  const SubmitIcon = preferencesForm.submit.icon;

  function toggleCategory(categoryId) {
    setSelectedCategoryIds((currentIds) =>
      currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSaveInterests(selectedCategoryIds);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="my-preferences-title"
      >
        <DashboardPageHeading
          id="my-preferences-title"
          icon={Settings2}
          title="My Preferences"
          summary={<PreferencesSummary events={events} interestIds={interestIds} />}
        />
        <div className="contact-form-container">
          <form className="contact-form" onSubmit={handleSubmit}>
            <fieldset className="contents">
              <legend className="contact-form-title">
                {preferencesForm.title}
              </legend>
              <p className="content-p">{preferencesForm.description}</p>
              <div className="preferences-options">
                {preferenceCategories.map((category) => (
                  <label className="preferences-option" key={category.id}>
                    <input
                      type="checkbox"
                      name="categories"
                      value={category.id}
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="dashboard-flex">
              <Button type="submit" variant="primary" size="md">
                <SubmitIcon aria-hidden="true" />
                {preferencesForm.submit.label}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
