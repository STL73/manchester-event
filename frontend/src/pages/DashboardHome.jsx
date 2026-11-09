import { useEffect } from "react";
import AccountBanner from "../components/dashboard/AccountBanner";
import DashboardGreeting from "../components/dashboard/DashboardGreeting";
import AdminDashboardHome from "./AdminDashboardHome";
import OrganiserDashboardHome from "./OrganiserDashboardHome";
import UserDashboardHome from "./UserDashboardHome";

const dashboardByRole = {
  user: UserDashboardHome,
  organiser: OrganiserDashboardHome,
  admin: AdminDashboardHome,
};

// Home for whichever role is signed in
export default function DashboardHome({ selectedUser, account, onLoadNotifications, ...props }) {
  const DashboardComponent = dashboardByRole[selectedUser?.type];
  // Every Home counts unread notifications, and nothing pushes new ones
  useEffect(() => {
    onLoadNotifications?.();
  }, [onLoadNotifications]);

  // The greeting is on Home only
  return (
    <>
      <DashboardGreeting
        selectedUser={selectedUser}
        users={props.users}
        events={props.events}
        organiserEvents={props.organiserEvents}
        favouriteIds={props.favouriteIds}
        favouriteEvents={props.favouriteEvents}
      />
      {/* mx-4: lines up with the sections below, which pad their content 16px */}
      <AccountBanner account={account} className="mx-4" />
      <DashboardComponent selectedUser={selectedUser} {...props} />
    </>
  );
}
