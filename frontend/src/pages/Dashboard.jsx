import { Outlet } from "react-router-dom";
import { Suspense, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import WeatherDateBar from "../components/dashboard/WeatherDateBar";
import PageLoading from "../components/UI/PageLoading";

export default function Dashboard({
  selectedUser,
  secondaryNav,
  onLogout,
  onSwitchUserType,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className={`dashboard-container ${isSidebarCollapsed ? "sidebar-is-collapsed" : ""}`}
    >
      <Sidebar
        selectedUser={selectedUser}
        secondaryNav={secondaryNav}
        isCollapsed={isSidebarCollapsed}
        onLogout={onLogout}
        onSwitchUserType={onSwitchUserType}
      />
      <div className="dashboard-content">
        <WeatherDateBar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />
        {/* Each page is its own download (see App); the sidebar and the
            weather bar stay while it arrives */}
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
