import { MessageSquare } from "lucide-react";
import Button from "../components/UI/Button";
import FaqList from "../components/UI/FaqList";
import PageHero from "../components/UI/PageHero";
import { faqGroups, faqPage } from "../data/faqData";

export default function Faq() {
  const { hero, contactLink } = faqPage;

  return (
    <div className="reading-page">
      <PageHero compact eyebrow={hero.eyebrow} title={hero.title} titleId="faq-title" intro={hero.intro} />

      <div className="reading-column">
        {faqGroups.map(({ id, title, items }) => (
          <section className="faq-group" aria-labelledby={`faq-${id}`} key={id}>
            <h2 className="reading-heading" id={`faq-${id}`}>
              {title}
            </h2>
            <FaqList items={items} />
          </section>
        ))}

        <Button to={contactLink.to} variant="secondary" size="md" className="self-start">
          <MessageSquare aria-hidden="true" />
          {contactLink.label}
        </Button>
      </div>
    </div>
  );
}
