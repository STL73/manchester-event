import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarSearch,
  ChartNoAxesCombined,
  CircleHelp,
  CircleUserRound,
  ClipboardList,
  Heart,
  Home,
  Logs,
  Mail,
  MessageSquareText,
  Settings,
  Settings2,
  SquarePen,
  Users,
} from "lucide-react";

// The public pages a signed-in person still needs; the dashboard hides the
// public navbar and footer, so these are its only way to them. They open
// inside the dashboard, beside the sidebar
const faqLink = { title: "FAQs", url: "/dashboard/faq", icon: CircleHelp };
const contactLink = { title: "Contact us", url: "/dashboard/contact", icon: Mail };

// Sidebar links. `section` puts a small label over a run of links; Home
// stays above them, unlabelled, for every role. `badge` shows a count from
// App's navCounts when it is above 0: `label` finishes the screen-reader
// text ("3 drafts") and `tone` matches the Home card with the same figure
const navigationData = [
  {
    role: [
      {
        type: "user",
        user: "userName",
        email: "user@email.com",
        avatar: CircleUserRound,
        mainNav: [
          { title: "Home", url: "/dashboard/home", icon: Home },
          {
            title: "Explore Events",
            url: "/dashboard/explore-events",
            icon: CalendarSearch,
            section: "Events",
          },
          {
            title: "My Favourites",
            url: "/dashboard/my-favourites",
            icon: Heart,
            section: "Events",
          },
          {
            title: "Preferences",
            url: "/dashboard/preferences",
            icon: Settings2,
            section: "Events",
          },
        ],
        helpNav: [faqLink, contactLink],
      },
      {
        type: "organiser",
        user: "organiserName",
        email: "organiser@email.com",
        avatar: CircleUserRound,
        mainNav: [
          { title: "Home", url: "/dashboard/home", icon: Home },
          {
            title: "Create Event",
            url: "/dashboard/create-events",
            icon: CalendarPlus,
            section: "Events",
          },
          {
            title: "My Events",
            url: "/dashboard/my-events",
            icon: CalendarCheck,
            section: "Events",
            // Rejected events wait for the organiser to edit them; red like
            // the Rejected card on Home
            badge: { count: "rejected", label: "rejected", tone: "danger" },
          },
          {
            title: "My Drafts",
            url: "/dashboard/my-drafts",
            icon: SquarePen,
            section: "Events",
            badge: { count: "drafts", label: "drafts" },
          },
          {
            title: "Event Analytics",
            url: "/dashboard/event-analytics",
            icon: ChartNoAxesCombined,
            section: "Insights",
          },
        ],
        helpNav: [
          // About is built around the approval steps
          { title: "How approval works", url: "/dashboard/about", icon: BadgeCheck },
          faqLink,
          contactLink,
        ],
      },
      {
        type: "admin",
        user: "adminName",
        email: "admin@email.com",
        avatar: CircleUserRound,
        mainNav: [
          { title: "Home", url: "/dashboard/home", icon: Home },
          {
            title: "Manage Events",
            url: "/dashboard/manage-events",
            icon: ClipboardList,
            section: "Moderation",
            // Yellow like the Events to review card on Home
            badge: { count: "toReview", label: "to review", tone: "warning" },
          },
          {
            title: "Manage Users",
            url: "/dashboard/manage-users",
            icon: Users,
            section: "Moderation",
          },
          {
            title: "Contact Messages",
            url: "/dashboard/contact-messages",
            icon: MessageSquareText,
            section: "Moderation",
            badge: { count: "unreadMessages", label: "unread" },
          },
          {
            title: "Site Analytics",
            url: "/dashboard/site-analytics",
            icon: ChartNoAxesCombined,
            section: "Insights",
          },
          {
            title: "System Logs",
            url: "/dashboard/system-logs",
            icon: Logs,
            section: "Insights",
          },
        ],
        // Admins read the contact messages rather than send them
        helpNav: [],
      },
    ],
  },
  {
    secondaryNav: [
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
        badge: { count: "unreadNotifications", label: "unread" },
      },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const helpNavTitle = "Help";

// Small print under the signed-in user, for every role
export const legalNav = [
  { title: "About", url: "/dashboard/about" },
  { title: "Privacy", url: "/dashboard/privacy" },
  { title: "Terms", url: "/dashboard/terms" },
];

// Public header links. "end" keeps Home active only on "/". Home is
// guestOnly: signed in, "/" is their dashboard, which the Dashboard button
// already links to
export const publicNav = [
  { title: "Home", url: "/", end: true, guestOnly: true },
  { title: "Explore Events", url: "/events" },
  { title: "About Us", url: "/about" },
  { title: "Contact Us", url: "/contact" },
];

// Footer link groups. "Find events" are filter links into Explore Events,
// the most useful thing a footer can hold on an events site
export const footerNav = [
  {
    title: "Find events",
    links: [
      { title: "What's on", url: "/events" },
      { title: "Tonight", url: "/events?when=tonight" },
      { title: "This weekend", url: "/events?when=weekend" },
      { title: "Next 7 days", url: "/events?when=week" },
    ],
  },
  {
    title: "Organisers",
    links: [
      { title: "List your event", url: "/auth/sign-up" },
      // About is built around the approval steps
      { title: "How approval works", url: "/about" },
      { title: "Log in", url: "/auth/login" },
    ],
  },
  {
    title: "Portal",
    links: [
      { title: "About us", url: "/about" },
      { title: "Contact us", url: "/contact" },
      { title: "FAQs", url: "/faq" },
      { title: "Privacy", url: "/privacy" },
      { title: "Terms", url: "/terms" },
    ],
  },
];

export const footerText = {
  tagline: "Made in Manchester, for Manchester. Every event checked by a person before it goes live.",
  // Shown huge and faded across the bottom, echoing the Home hero
  wordmark: "Manchester",
  rights: "Manchester Event Portal · Every event checked by a person",
  socialsLabel: "Follow us",
  backToTop: "Back to top",
};

export function getData() {
  return navigationData;
}

// The role's sidebar and default icon; the first role when nobody is logged in
export function getUserData(userType) {
  return (
    navigationData[0].role.find(({ type }) => type === userType) ??
    navigationData[0].role[0]
  );
}
