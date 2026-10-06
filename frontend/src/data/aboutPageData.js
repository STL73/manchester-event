import {
  CalendarPlus,
  CalendarSearch,
  ClipboardCheck,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

import skylineSunset from "../images/site/manchester-skyline-sunset.webp";
import canalNarrowboat from "../images/site/canal-narrowboat-mills.webp";
import beeMosaic from "../images/site/manchester-bee-mosaic.webp";

// One job: who runs the site and why it can be trusted. What's on lives on
// Home, how to get help on Contact
export const aboutPageData = {
  hero: {
    eyebrow: "About Us",
    title: "Made in Manchester, for Manchester",
    intro:
      "One place to find what's on across Greater Manchester, from gigs and food festivals to family days out, listed by local organisers and checked by a person.",
    // Decorative: the heading says what the page is
    image: { src: skylineSunset, alt: "" },
  },
  story: {
    title: "Our story",
    paragraphs: [
      "Manchester Event Portal connects local businesses, event organisers and the people who go to their events. Organisers list what they're running for free, and everyone else can find it in one place.",
      "We want it to be easy for everyone to find and join the events that matter to them, whether that's a cultural night, a professional meetup or just a fun evening out.",
      "We believe in the power of community, and we're building a platform that helps Manchester stay a vibrant place to live, work and play.",
    ],
    image: {
      src: canalNarrowboat,
      alt: "A narrowboat moored by red-brick mills on a Manchester canal",
    },
    bee: { src: beeMosaic, alt: "The Manchester worker bee" },
  },
  process: {
    title: "How an event goes live",
    steps: [
      {
        icon: CalendarPlus,
        title: "An organiser submits it",
        text: "Organisers add the date, place, details and a photo from their dashboard.",
      },
      {
        icon: ClipboardCheck,
        title: "An admin reviews it",
        text: "Someone on our team checks it's real, local and clearly described. Anything that needs fixing goes back to the organiser.",
      },
      {
        icon: Megaphone,
        title: "It goes live",
        text: "Approved events appear on Explore Events straight away, ready to share.",
      },
      {
        icon: CalendarSearch,
        title: "You find it",
        text: "Search by date, category or area, save favourites and get reminders.",
      },
    ],
    promise: {
      icon: ShieldCheck,
      text: "Every event is checked by a person before it appears.",
    },
  },
  // Labels only: the numbers are counted from the live data so they never go stale
  stats: {
    title: "The portal in numbers",
    events: "events listed",
    categories: "categories",
    areas: "areas covered",
  },
  closing: {
    title: "Why the bee?",
    text: "The worker bee has been Manchester's symbol since the Industrial Revolution and is on the city's coat of arms. It stands for hard work and a city that pulls together. Our logo puts it in a honeycomb cell: lots of people, one hive.",
    explore: { label: "Explore Events", to: "/events" },
    signUp: { label: "List your event", to: "/auth/sign-up" },
  },
};
