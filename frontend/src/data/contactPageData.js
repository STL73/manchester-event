import { Mail, MapPin, RefreshCw, Send } from "lucide-react";

// A task page: the form sits beside the answers people most often need, so
// many questions are answered before a message is sent. Social links live in
// the footer only
export const contactPageData = {
  title: "Contact Us",
  intro:
    "Questions, feedback or a problem with an event? Check the quick answers first, or send us a message.",
  responseNote: "We reply within 1–2 working days.",
  quickAnswers: {
    title: "Quick answers",
    items: [
      {
        question: "Do I need an account to browse events?",
        answer:
          "No. Anyone can browse and search events. A free account lets you save favourites, set your preferences and get reminders.",
      },
      {
        question: "How do I list my event?",
        answer:
          "Sign up as an organiser, then choose Create Events in your dashboard. You can save it as a draft or submit it for approval straight away.",
      },
      {
        question: "When will my event appear on the site?",
        answer:
          "An admin checks every new or edited event before it goes public. You can follow its status (Pending, Approved or Rejected) in My Events.",
      },
      {
        question: "How do I edit or cancel my event?",
        answer:
          "Open My Events in your dashboard and choose Edit. The edit page also has a Cancel Event button.",
      },
    ],
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
