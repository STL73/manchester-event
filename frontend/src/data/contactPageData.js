import { Mail, MapPin, RefreshCw, Send } from "lucide-react";

import manchesterOutdoorDiningLights from "../images/events/manchester-outdoor-dining-lights.jpg";

// A task page: the most common questions sit beside the form, so many are
// answered before a message is sent. They come from data/faqData.js (the
// ones marked `featured`); the FAQs page has the rest. Social links live in
// the footer only
export const contactPageData = {
  hero: {
    eyebrow: "Contact Us",
    title: "We're here to help",
    intro:
      "Questions, feedback or a problem with an event? Check the quick answers first, or send us a message.",
    // Decorative: the heading says what the page is
    image: { src: manchesterOutdoorDiningLights, alt: "", width: 1200, height: 1799, position: "center 30%" },
  },
  responseNote: "We reply within 1–2 working days.",
  quickAnswers: {
    title: "Quick answers",
    seeAll: { label: "See all FAQs", to: "/faq" },
  },
  // Placeholders until the real details are decided
  contactDetails: [
    {
      label: "Email",
      value: "manchestereventportal@gmail.com",
      icon: Mail,
      href: "mailto:manchestereventportal@gmail.com",
    },
    { label: "Address", value: "123 Main Street, Manchester, UK", icon: MapPin },
  ],
  form: {
    title: "Send a message",
    fields: [
      { id: "name", label: "Name", type: "text", placeholder: "Your name", autoComplete: "name" },
      { id: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
      { id: "message", label: "Message", type: "textarea", placeholder: "How can we help?" },
    ],
  },
  actions: {
    submit: { label: "Send Message", icon: Send },
    reset: { label: "Reset", icon: RefreshCw },
  },
};
