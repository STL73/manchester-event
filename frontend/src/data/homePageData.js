import { CalendarPlus, Heart, Search } from "lucide-react";

import townHallClockTower from "../images/site/town-hall-clock-tower.webp";
import northernQuarterMural from "../images/site/northern-quarter-mural.webp";
import mediacityDusk from "../images/site/mediacity-dusk.webp";
import salfordQuaysDay from "../images/site/salford-quays-day.webp";
import heatonParkTemple from "../images/site/heaton-park-temple.webp";

// Served from public/ so the database can store the same paths
const stageConfetti = "/images/events/stage-confetti.jpg";
const manchesterFireworksNight = "/images/events/manchester-fireworks-night.jpg";
const arenaBlueLasers = "/images/events/arena-blue-lasers.jpg";
const colourPowderFestival = "/images/events/colour-powder-festival.jpg";

// One job: show what's on and send visitors into Explore Events with a filter
// already set. Home never holds the full list; who runs the site is on About.
export const homePageData = {
  hero: {
    title: "Manchester Event Portal",
    // The giant word and the line under it; the <h1> reads the full title
    word: "Manchester",
    name: "Event Portal",
    intro:
      "Gigs, markets, festivals and family days out across Greater Manchester, every one checked by a person before it goes live.",
    // Shown in turn inside the letters, four seconds each. Bright, colourful
    // shots only: dark or busy ones (a night crowd) make the letters vanish
    images: [stageConfetti, manchesterFireworksNight, arenaBlueLasers, colourPowderFestival],
    search: {
      label: "Search events",
      placeholder: "Try jazz, markets, Salford…",
      button: { label: "Search", icon: Search },
    },
  },
  whatsOn: {
    title: "What's on",
    // At most one row of cards: the full list belongs on Explore Events
    limit: 3,
    seeAll: (total) => `See all ${total}`,
    empty: "Nothing listed for these dates yet.",
    loadError: "Events couldn't be loaded just now.",
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
