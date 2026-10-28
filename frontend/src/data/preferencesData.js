import {
  Baby,
  BookOpen,
  Clapperboard,
  Cpu,
  Drama,
  GraduationCap,
  Hammer,
  HandHeart,
  HeartPulse,
  Landmark,
  MoonStar,
  Music,
  Palette,
  PartyPopper,
  Rainbow,
  SquareCheck,
  Store,
  Tag,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";

import { eventCategories } from "./eventsData";

// The line under the page title: "2 interests · 14 upcoming events match them"
export const preferencesSummary = {
  interest: "interest",
  interests: "interests",
  matchingOne: "upcoming event matches them",
  matching: "upcoming events match them",
  none: "Choose at least one interest to get event alerts",
};

export const preferencesForm = {
  title: "Pick your interests",
  description: "We'll let you know when new events open in these categories.",
  submit: { label: "Save Preferences", icon: SquareCheck },
  saved: "Your preferences have been saved",
};

// The panel beside the honeycomb (a bar above it on narrow screens). It
// previews the unsaved choice, so it counts the ticked hexagons, not the
// saved interests
export const yourPicks = {
  title: "Your picks",
  upcomingOne: "upcoming event",
  upcoming: "upcoming events",
  nothing: "Nothing picked yet",
  comingUp: "Coming up for you",
  noneComing: "No upcoming events in these categories yet",
  pickFirst: "Pick a category to see what's coming up",
  shownCount: 3,
};

// Count under each category name
export function categoryCountLabel(count) {
  return count === 0 ? "None yet" : `${count} upcoming`;
}

// Icon per category slug. Categories will come from the database, so one
// added there without an entry here gets the plain tag rather than breaking
const categoryIcons = {
  "art-exhibitions": Palette,
  "charity-causes": HandHeart,
  "community-culture": Users,
  "family-kids": Baby,
  festivals: PartyPopper,
  "film-screenings": Clapperboard,
  "food-drink": Utensils,
  "health-wellness": HeartPulse,
  "history-heritage": Landmark,
  lgbtq: Rainbow,
  "literature-talks": BookOpen,
  "markets-fairs": Store,
  music: Music,
  nightlife: MoonStar,
  sports: Trophy,
  "student-life": GraduationCap,
  "tech-innovation": Cpu,
  "theatre-performance": Drama,
  "workshops-classes": Hammer,
};

export function categoryIcon(categoryId) {
  return categoryIcons[categoryId] ?? Tag;
}

// Matches get_all_categories(): ordered by name
export const preferenceCategories = [...eventCategories].sort((a, b) =>
  a.name.localeCompare(b.name),
);

// Mock of the user's rows in the notification_preferences table
export const userCategoryIds = ["music", "community-culture"];
