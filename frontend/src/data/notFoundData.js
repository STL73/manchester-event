import { House, LayoutDashboard, SearchX } from "lucide-react";

// Shown for any address that doesn't match a route. The way out depends on
// who is looking: guests go to the landing page, signed-in users to their
// dashboard home
export const notFoundPage = {
  title: "Page not found",
  titleIcon: SearchX,
  message:
    "The address may be mistyped, or the page may have moved. Check the address, or use the button below.",
  guestAction: { label: "Go to home page", to: "/", icon: House },
  userAction: { label: "Go to dashboard", to: "/dashboard/home", icon: LayoutDashboard },
  // Already in the dashboard, so the button names the page it goes to
  dashboardAction: { label: "Back to dashboard home", to: "/dashboard/home", icon: House },
};
