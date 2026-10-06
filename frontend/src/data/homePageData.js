import {
  Bell,
  CalendarCheck,
  CalendarSearch,
  CalendarPlus,
  CircleUserRound,
  LayoutList,
  Settings2,
  UserRoundPlus,
  Users,
} from "lucide-react";

import concert1 from "../images/concert1.jpg";
import concert4 from "../images/concert4.jpg";
import concert6 from "../images/concert6.jpg";

export const homePageData = {
  hero: {
    image: concert6,
    imageAlt: "Live event audience",
  },
  promote: {
    title: "Looking to promote your event? Choose Manchester Event Portal.",
    image: concert4,
    imageAlt: "People enjoying a live event",
    button: { label: "Create Events", to: "/auth/sign-up" },
    features: [
      {
        icon: CalendarPlus,
        title: "Cost-free events promotion.",
        description:
          "Promote your events in Manchester for free. No subscriptions or fees required. Share your events, photos and reach your target audience.",
      },
      {
        icon: UserRoundPlus,
        title: "Seamless registration",
        description:
          "Sign up with our easy-to-follow registration process. Create your account and list all of your events.",
      },
      {
        icon: LayoutList,
        title: "User-friendly interface",
        description:
          "Use an intuitive dashboard to add, update, edit and delete your events. Get approval for changes from our admin.",
      },
    ],
  },
  discover: {
    title: "Searching for events in Manchester? You are at the right place.",
    image: concert1,
    imageAlt: "Crowd at a Manchester event",
    button: { label: "Explore Events", to: "/events" },
    features: [
      {
        icon: CalendarSearch,
        title: "Find events by category",
        description:
          "Explore all types of events in Manchester: music, arts, sports, conferences, webinars and more.",
      },
      {
        icon: CircleUserRound,
        title: "Just search or create an account",
        description:
          "Search for events without registration, or create an account and bookmark your favourite events.",
      },
      {
        icon: LayoutList,
        title: "User-friendly dashboard",
        description:
          "Manage your bookmarked events from the dashboard and get reminders for events in your favourite list.",
      },
    ],
  },
  platform: {
    title: "All you need for your events in one platform.",
    features: [
      {
        icon: CalendarPlus,
        title: "Organisers",
        description:
          "Create and promote events while reaching your target audience.",
      },
      {
        icon: Users,
        title: "Event hunters",
        description:
          "Find high art, professional progress, exciting sports or simple fun in one place.",
      },
      {
        icon: UserRoundPlus,
        title: "Free and easy registration",
        description:
          "Use an intuitive interface for effortless task completion and navigation.",
      },
    ],
  },
  preferences: {
    title: "Set preferences and get notified about upcoming events.",
    features: [
      {
        icon: Settings2,
        title: "Personalised preferences",
        description:
          "Choose the event categories and interests that matter to you.",
      },
      {
        icon: Bell,
        title: "Useful notifications",
        description:
          "Get timely reminders about events that match your interests.",
      },
      {
        icon: CalendarCheck,
        title: "Never miss an event",
        description:
          "Keep your favourite events organised and ready for your next plan.",
      },
    ],
  },
};
