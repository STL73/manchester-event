import Button from "../components/UI/Button";
import { notFoundPage } from "../data/notFoundData";

export default function NotFound({ isUser = false, inDashboard = false }) {
  const { title, titleIcon: TitleIcon, message } = notFoundPage;
  const action = inDashboard
    ? notFoundPage.dashboardAction
    : isUser
      ? notFoundPage.userAction
      : notFoundPage.guestAction;
  const actionButton = (
    <Button to={action.to} variant="primary" size="md">
      <action.icon aria-hidden="true" />
      {action.label}
    </Button>
  );

  // Inside the dashboard the sidebar stays, so the page keeps its layout
  if (inDashboard) {
    return (
      <div className="dashboard-home">
        <section className="dashboard-section" aria-labelledby="not-found-title">
          <h2 className="dashboard-title" id="not-found-title">
            <TitleIcon className="dashboard-title-icon" aria-hidden="true" />
            {title}
          </h2>
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{message}</p>
            {actionButton}
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="section-content" aria-labelledby="not-found-title">
      <h1 className="section-title" id="not-found-title">
        {title}
      </h1>
      <p className="content-p">{message}</p>
      {actionButton}
    </section>
  );
}
