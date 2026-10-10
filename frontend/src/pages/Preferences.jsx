import { useState } from "react";
import { ListChecks, Settings2 } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardCard from "../components/UI/DashboardCard";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import {
  interestsInsight,
  preferenceCategories,
  preferencesActions,
  preferencesForm,
  userCategoryIds,
} from "../data/preferencesData";

export default function Preferences() {
  const [savedCategoryIds, setSavedCategoryIds] = useState(userCategoryIds);
  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState(userCategoryIds);
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
    setSavedCategoryIds(selectedCategoryIds);
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
          actions={preferencesActions}
        />
        <div className="dashboard-grid">
          <DashboardCard
            item={{ ...interestsInsight, count: savedCategoryIds.length }}
          />
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="set-preferences-title"
      >
        <h2 className="dashboard-title" id="set-preferences-title">
          <ListChecks className="dashboard-title-icon" aria-hidden="true" />
          Set Preferences
        </h2>
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
