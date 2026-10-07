import { CalendarPlus, Heart, Search } from "lucide-react";

import stageConfetti from "../images/events/stage-confetti.jpg";
import townHallClockTower from "../images/site/town-hall-clock-tower.webp";
import northernQuarterMural from "../images/site/northern-quarter-mural.webp";
import mediacityDusk from "../images/site/mediacity-dusk.webp";
import salfordQuaysDay from "../images/site/salford-quays-day.webp";
import heatonParkTemple from "../images/site/heaton-park-temple.webp";

// One job: show what's on and send visitors into Explore Events with a filter
// already set. Home never holds the full list; who runs the site is on About.
export const homePageData = {
  hero: {
    titleLead: "Welcome to",
    title: "Manchester Event Portal",
    intro:
      "Gigs, markets, festivals and family days out across Greater Manchester, every one checked by a person before it goes live.",
    image: stageConfetti,
    imageAlt: "Confetti falling over a crowd at a live show",
    search: {
      label: "Search events",
      placeholder: "Try jazz, food market, Salford...",
      button: { label: "Search", icon: Search },
    },
  },
  whatsOn: {
    title: "What's on",
    // At most one row of cards: the full list belongs on Explore Events
    limit: 3,
    seeAll: (total) => `See all ${total}`,
    empty: "Nothing listed for these dates yet.",
    emptyLink: "Browse every upcoming event",
  },
  areas: {
    title: "Explore by area",
    count: (total) =>
      total === 0 ? "Nothing listed yet" : `${total} upcoming ${total === 1 ? "event" : "events"}`,
    // ids match eventLocations; the image is decorative because the tile names the area
    tiles: [
      { id: "city-centre", image: townHallClockTower, position: "center 30%" },
      { id: "northern-quarter", image: northernQuarterMural, position: "center 40%" },
      { id: "mediacity", image: mediacityDusk },
      { id: "salford", image: salfordQuaysDay },
      { id: "heaton-park", image: heatonParkTemple },
    ],
  },
  categories: {
    title: "Browse by category",
  },
  // Replaces the four feature sections that repeated each other
  audiences: [
    {
      icon: Heart,
      title: "Going out?",
      text: "Browsing is free and needs no account. Sign up to save favourites and get a reminder before they start.",
      button: { label: "Create a free account", to: "/auth/sign-up" },
    },
    {
      icon: CalendarPlus,
      title: "Organising?",
      text: "List your event for free. We check every listing before it goes public, so people trust what they find here.",
      button: { label: "List your event", to: "/auth/sign-up" },
    },
  ],
};
