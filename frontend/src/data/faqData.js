// Every question in one place. The FAQs page shows them all, grouped; Contact
// shows the ones marked `featured` beside the form, with a link here. The
// answers follow the agreed rules (schema-decisions): approval before going
// public, delete only before an event has been public, cancel after that.
export const faqPage = {
  hero: {
    eyebrow: "FAQs",
    title: "Questions, answered",
    intro: "How browsing, listing and approval work on Manchester Event Portal. Can't find your answer? Send us a message.",
  },
  contactLink: { label: "Contact us", to: "/contact" },
};

export const faqGroups = [
  {
    id: "browsing",
    title: "Finding events",
    items: [
      {
        question: "Do I need an account to browse events?",
        answer:
          "No. Anyone can browse and search events. A free account lets you save favourites, set your interests and get reminders before events start.",
        featured: true,
      },
      {
        question: "What do Tonight, This weekend and Next 7 days include?",
        answer:
          "Tonight is anything still to happen today. This weekend runs from Friday 5pm to the end of Sunday. Next 7 days is today plus the following six days.",
        featured: true,
      },
      {
        question: "Are the events free?",
        answer:
          "Listing and browsing are free. Each event's price is set by its organiser: open the event and follow its ticket link for prices and booking.",
      },
      {
        question: "How will I know if an event is cancelled?",
        answer:
          "A cancelled event comes off the listings straight away. If you saved it as a favourite, check My Favourites in your dashboard before you set off.",
      },
      {
        question: "How do reminders work?",
        answer:
          "Save an event as a favourite and choose your interests in Preferences. We'll remind you before your favourite events start and tell you about new ones that match your interests.",
      },
    ],
  },
  {
    id: "organisers",
    title: "Listing events",
    items: [
      {
        question: "How do I list my event?",
        answer:
          "Sign up as an organiser, then choose Create Events in your dashboard. You can save it as a draft or submit it for approval straight away.",
        featured: true,
      },
      {
        question: "When will my event appear on the site?",
        answer:
          "A person checks every new or edited event before it goes public. You can follow its status (Pending, Approved or Rejected) in My Events.",
        featured: true,
      },
      {
        question: "Why was my event rejected?",
        answer:
          "Usually because details are missing or unclear, the event isn't in Greater Manchester, or the image isn't yours to use. Every rejection comes with the reason, so you can fix it and submit the event again.",
      },
      {
        question: "What happens when I edit an approved event?",
        answer:
          "The edit goes back for approval, and the last approved version stays public until it's checked. People who saved your event keep it in their favourites.",
      },
      {
        question: "How do I edit or cancel my event?",
        answer:
          "Open My Events in your dashboard and choose Edit. The edit page also has a Cancel Event button.",
        featured: true,
      },
      {
        question: "Can I delete an event?",
        answer:
          "Only before it has ever been public, while it's a draft or waiting for approval. Once people have seen it, it can be cancelled but not deleted, so nobody is left with a link that goes nowhere.",
      },
      {
        question: "Does it cost anything to list an event?",
        answer: "No. Listing is free, with no subscriptions or fees.",
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    items: [
      {
        question: "How do I change my email or password?",
        answer: "Open Settings in your dashboard. Your account details and password are both there.",
      },
      {
        question: "How do I close my account?",
        answer:
          "Send us a message from the Contact page. If you're an organiser with events that have been public, we'll suspend the account instead, so those events keep their history.",
      },
      {
        question: "How do I report a problem with an event?",
        answer:
          "Send us a message from the Contact page with the event's name. We'll look into it and contact the organiser if something needs fixing.",
        featured: true,
      },
    ],
  },
];

export const featuredQuestions = faqGroups.flatMap((group) => group.items).filter((item) => item.featured);
