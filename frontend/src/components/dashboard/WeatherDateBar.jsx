import {
  CalendarDays,
  Clock3,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { describeWeather, weatherPlace } from "../../data/weatherData";

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

// Manchester's weather now, reloaded every 15 minutes; null until the first reading arrives
function useWeather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(weatherPlace.url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Weather: ${response.status}`);
        const { current } = await response.json();
        setWeather({
          temperature: Math.round(current.temperature_2m),
          ...describeWeather(current.weather_code, current.is_day === 1),
        });
      } catch {
        // No weather is no harm: the bar keeps the last reading, or shows none
      }
    }
    load();
    const timer = window.setInterval(load, weatherPlace.refreshMs);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return weather;
}

// The bar above every dashboard page: sidebar toggle, weather, date and time.
// Phones open the sidebar as a drawer; wide screens switch to its icon rail
export default function WeatherDateBar({
  isNarrow,
  isSidebarOpen,
  onToggleSidebar,
  toggleRef,
}) {
  const [now, setNow] = useState(() => new Date());
  const weather = useWeather();
  let ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  let toggleLabel = isSidebarOpen ? "Collapse sidebar" : "Expand sidebar";
  if (isNarrow) {
    ToggleIcon = Menu;
    toggleLabel = "Open menu";
  }

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
        ref={toggleRef}
        className="sidebar-toggle"
        type="button"
        onClick={onToggleSidebar}
        aria-label={toggleLabel}
        aria-controls="dashboard-sidebar"
        aria-expanded={isSidebarOpen}
      >
        <ToggleIcon aria-hidden="true" />
      </button>
      <div className="dashboard-utility-items">
        {/* Each item: icon + one text block, so on narrow screens the text
            wraps inside its block and the icon stays beside it */}
        {weather && (
          <>
            <div className="dashboard-utility-item">
              <weather.icon className="dashboard-utility-icon" aria-hidden="true" />
              <span className="dashboard-utility-text">
                <span>{weatherPlace.label}</span>
                <strong>{weather.temperature}°C</strong>
                <span>{weather.condition}</span>
              </span>
            </div>
            <div className="dashboard-utility-divider" aria-hidden="true" />
          </>
        )}
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
