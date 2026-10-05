import {
  CalendarDays,
  Clock3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { mockWeather } from "../../data/weatherData";

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function WeatherDateBar({ isSidebarCollapsed, onToggleSidebar }) {
  const [now, setNow] = useState(() => new Date());
  const WeatherIcon = mockWeather.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="dashboard-utility-bar"
      aria-label="Weather and date information"
    >
      <button
        className="sidebar-toggle"
        type="button"
        onClick={onToggleSidebar}
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isSidebarCollapsed}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen aria-hidden="true" />
        ) : (
          <PanelLeftClose aria-hidden="true" />
        )}
      </button>
      <div className="dashboard-utility-items">
        {/* Each item: icon + one text block, so on narrow screens the text
            wraps inside its block and the icon stays beside it */}
        <div className="dashboard-utility-item">
          <WeatherIcon className="dashboard-utility-icon" aria-hidden="true" />
          <span className="dashboard-utility-text">
            <span>{mockWeather.location}</span>
            <strong>{mockWeather.temperature}°C</strong>
            <span>{mockWeather.condition}</span>
          </span>
        </div>
        <div className="dashboard-utility-divider" aria-hidden="true" />
        <div className="dashboard-utility-item">
          <CalendarDays className="dashboard-utility-icon" aria-hidden="true" />
          <span className="dashboard-utility-text">{formatDate(now)}</span>
        </div>
        <div className="dashboard-utility-item">
          <Clock3 className="dashboard-utility-icon" aria-hidden="true" />
          <span className="dashboard-utility-text">{formatTime(now)}</span>
        </div>
      </div>
    </div>
  );
}
