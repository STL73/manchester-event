// Privacy and Terms, shown by LegalPage.jsx. Written for this portfolio
// project and kept to what the app actually stores (see the database schema):
// a draft, not legal advice. Review before the site takes real users.
const draftNote =
  "This is a plain-English draft written for a portfolio project. It is not legal advice and will be reviewed before the site opens to the public.";

export const privacyPage = {
  hero: {
    eyebrow: "Privacy",
    title: "Your data, in plain English",
    intro: "What we collect, why we need it, who can see it and how to ask us to change or remove it.",
  },
  updated: "Last updated 7 October 2026",
  draftNote,
  sections: [
    {
      title: "What we collect",
      paragraphs: [
        "Your account: a display name, your email address and your password, which we store only in scrambled (hashed) form, so nobody can read it, us included.",
        "What you do on the site: the events you save as favourites, the interests you choose, your notification settings and any messages you send us.",
        "If you're an organiser: the details of the events you submit, including their images.",
      ],
    },
    {
      title: "Why we need it",
      paragraphs: [
        "To run your account, show your favourites, send the reminders and notifications you ask for, and check events before they go public.",
        "We don't sell your data, and we don't use it for advertising.",
      ],
    },
    {
      title: "Who can see it",
      paragraphs: [
        "Approved events are public, along with the organiser's display name. Your email address, favourites and interests are never shown to other users.",
        "Our admins can see account and event details, so they can approve events and help when something goes wrong.",
      ],
    },
    {
      title: "How long we keep it",
      paragraphs: [
        "For as long as your account is open. Events that have been public are kept, so their history stays accurate. Messages you send us are kept until they're dealt with.",
      ],
    },
    {
      title: "Your rights",
      paragraphs: [
        "Under UK data protection law you can ask for a copy of your data, ask us to correct it, or ask us to delete it. Send us a message from the Contact page and we'll reply within one month.",
      ],
    },
  ],
};

export const termsPage = {
  hero: {
    eyebrow: "Terms",
    title: "Using Manchester Event Portal",
    intro: "The ground rules for browsing, keeping an account and listing events.",
  },
  updated: "Last updated 7 October 2026",
  draftNote,
  sections: [
    {
      title: "Using the site",
      paragraphs: [
        "Anyone can browse events. Please don't misuse the site: no attempts to break it, scrape it in bulk or get into other people's accounts.",
      ],
    },
    {
      title: "Your account",
      paragraphs: [
        "Keep your login details to yourself; you're responsible for what happens under your account. Tell us straight away if you think someone else has used it.",
      ],
    },
    {
      title: "Listing events",
      paragraphs: [
        "Organisers must give accurate details, list only events in Greater Manchester, and use only images they have the right to use.",
        "Every event is checked before it goes public. We can reject an event, giving the reason, or remove one that breaks these terms.",
        "An event can be deleted only before it has ever been public. After that it can be cancelled, so people who saved it aren't left with a broken link.",
      ],
    },
    {
      title: "Events are run by their organisers",
      paragraphs: [
        "We list events; we don't run them or sell their tickets. Prices, booking, refunds and safety on the day are between you and the organiser.",
      ],
    },
    {
      title: "Suspending accounts",
      paragraphs: [
        "We can suspend an account that breaks these terms. An organiser account with public events is suspended rather than deleted, so those events keep their history.",
      ],
    },
    {
      title: "Changes",
      paragraphs: [
        "We may update these terms. The date at the top shows when they last changed.",
      ],
    },
  ],
};
