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

export default function DashboardHome({ selectedUser, account, ...props }) {
  const DashboardComponent = dashboardByRole[selectedUser?.type];

  if (!DashboardComponent) {
    return (
      <section className="dashboard-section" {...props}>
        <h1 className="dashboard-title">Dashboard unavailable</h1>
        <p className="content-p">
          The {selectedUser?.type ?? "selected"} dashboard has not been created
          yet.
        </p>
      </section>
    );
  }

  // Greeting on the home page only (the PHP repeated it on every dashboard page)
  return (
    <>
      <DashboardGreeting
        selectedUser={selectedUser}
        users={props.users}
        events={props.events}
        organiserEvents={props.organiserEvents}
        favouriteIds={props.favouriteIds}
      />
      {/* mx-4: lines up with the sections below, which pad their content 16px */}
      <AccountBanner account={account} className="mx-4" />
      <DashboardComponent selectedUser={selectedUser} {...props} />
    </>
  );
}
