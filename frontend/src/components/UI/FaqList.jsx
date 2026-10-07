import { ChevronDown } from "lucide-react";

// Questions that open in place. <details> works without JavaScript and is
// keyboard accessible by default. Used on Contact and the FAQs page
export default function FaqList({ items }) {
  return (
    <div className="faq-list">
      {items.map(({ question, answer }) => (
        <details className="faq-item" key={question}>
          <summary>
            {question}
            <ChevronDown className="faq-icon" aria-hidden="true" />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
