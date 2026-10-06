import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarSearch,
  ChartNoAxesCombined,
  CircleUserRound,
  ClipboardList,
  Heart,
  Home,
  Logs,
  MessageSquareText,
  Settings,
  Settings2,
  SquarePen,
  Users,
} from "lucide-react";

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
          },
          {
            title: "My Favourites",
            url: "/dashboard/my-favourites",
            icon: Heart,
          },
          {
            title: "Preferences",
            url: "/dashboard/preferences",
            icon: Settings2,
          },
        ],
      },
      {
        type: "organiser",
        user: "organiserName",
        email: "organiser@email.com",
        avatar: CircleUserRound,
        mainNav: [
          { title: "Home", url: "/dashboard/home", icon: Home },
          {
            title: "Create Events",
            url: "/dashboard/create-events",
            icon: CalendarPlus,
          },
          {
            title: "My Events",
            url: "/dashboard/my-events",
            icon: CalendarCheck,
          },
          { title: "My Drafts", url: "/dashboard/my-drafts", icon: SquarePen },
          {
            title: "Event Analytics",
            url: "/dashboard/event-analytics",
            icon: ChartNoAxesCombined,
          },
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
            title: "Manage Users",
            url: "/dashboard/manage-users",
            icon: Users,
          },
          {
            title: "Manage Events",
            url: "/dashboard/manage-events",
            icon: ClipboardList,
          },
          {
            title: "Site Analytics",
            url: "/dashboard/site-analytics",
            icon: ChartNoAxesCombined,
          },
          { title: "System Logs", url: "/dashboard/system-logs", icon: Logs },
          {
            title: "Contact Messages",
            url: "/dashboard/contact-messages",
            icon: MessageSquareText,
          },
        ],
      },
    ],
  },
  {
    secondaryNav: [
      { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
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

// Link groups from footer.php; "Create Events" sends visitors to sign up first
export const footerNav = [
  {
    title: "Use Manchester Event Portal",
    links: [
      { title: "Explore Events", url: "/events" },
      { title: "Create Events", url: "/auth/sign-up" },
    ],
  },
  {
    title: "Contact Us",
    links: [
      { title: "Contact Us", url: "/contact" },
      { title: "About Us", url: "/about" },
    ],
  },
];

export const TEST_USER_TYPE = "user";

export function getData() {
  return navigationData;
}

export function getUserData(userType = TEST_USER_TYPE) {
  return (
    navigationData[0].role.find(({ type }) => type === userType) ??
    navigationData[0].role[0]
  );
}
