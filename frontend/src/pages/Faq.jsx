import { MessageSquare } from "lucide-react";
import Button from "../components/UI/Button";
import FaqList from "../components/UI/FaqList";
import PageFrame from "../components/UI/PageFrame";
import { faqGroups, faqPage } from "../data/faqData";

export default function Faq({ inDashboard = false }) {
  const { hero, dashboardHeading, contactLink } = faqPage;
  // Inside the dashboard, section headings look like every other dashboard page's
  const headingClass = inDashboard ? "dashboard-title" : "heading-section reading-heading";

  return (
    <PageFrame
      inDashboard={inDashboard}
      hero={hero}
      heading={dashboardHeading}
      titleId="faq-title"
      compact
      className="reading-page"
      bodyClassName="max-w-4xl self-start"
    >
      <div className="reading-column">
        {faqGroups.map(({ id, title, items }) => (
          <section className="faq-group" aria-labelledby={`faq-${id}`} key={id}>
            <h2 className={headingClass} id={`faq-${id}`}>
              {title}
            </h2>
            <FaqList items={items} />
          </section>
        ))}

        <Button
          to={inDashboard ? contactLink.dashboardTo : contactLink.to}
          variant="secondary"
          size="md"
          className="self-start"
        >
          <MessageSquare aria-hidden="true" />
          {contactLink.label}
        </Button>
      </div>
    </PageFrame>
  );
}
