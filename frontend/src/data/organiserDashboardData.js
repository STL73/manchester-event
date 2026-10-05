import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  ChartNoAxesCombined,
  CircleCheck,
  CircleX,
  ClipboardClock,
  History,
  SquarePen,
} from "lucide-react";

export const organiserDashboardActions = [
  { label: "Create Events", to: "/dashboard/create-events", icon: CalendarPlus },
  { label: "My Events", to: "/dashboard/my-events", icon: CalendarCheck },
  { label: "My Drafts", to: "/dashboard/my-drafts", icon: SquarePen },
  {
    label: "Event Analytics",
    to: "/dashboard/event-analytics",
    icon: ChartNoAxesCombined,
  },
];

// One card per get_event_status_count() call, in the PHP status colours
export const statusInsights = [
  {
    status: "approved",
    title: "Approved Events",
    icon: CircleCheck,
  },
  {
    status: "rejected",
    title: "Rejected Events",
    icon: CircleX,
    tone: "dashboard-card-accent-red",
    action: { label: "Edit and resubmit", to: "/dashboard/my-events" },
  },
  {
    status: "pending",
    title: "Pending Events",
    icon: ClipboardClock,
    tone: "dashboard-card-accent-yellow",
    action: { label: "View", to: "/dashboard/my-events" },
  },
  {
    status: "cancelled",
    title: "Cancelled Events",
    icon: CalendarX,
  },
  {
    status: "draft",
    title: "Draft Events",
    icon: SquarePen,
  },
  {
    status: "past",
    title: "Past Events",
    icon: History,
  },
];

export const lastCreatedInsight = {
  title: "Last Created Event",
  icon: CalendarPlus,
  emptyValue: "No events yet",
};

export const nextEventInsight = {
  title: "Next Event",
  icon: CalendarClock,
  emptyValue: "No upcoming events",
};
