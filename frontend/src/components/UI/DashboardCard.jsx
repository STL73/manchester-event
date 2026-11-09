import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

// item.trend = { current, previous, label, note }: an arrow and "+4 in the last
// 30 days", the note as a tooltip
function Trend({ trend }) {
  const Arrow =
    trend.current > trend.previous
      ? TrendingUp
      : trend.current < trend.previous
        ? TrendingDown
        : Minus;

  return (
    <p className="dashboard-card-context" title={trend.note}>
      <Arrow className="dashboard-card-context-icon" aria-hidden="true" />
      {trend.label}
      <span className="sr-only">, {trend.note}</span>
    </p>
  );
}

// A Home stat card: label, one big figure and one line of context, which is
// item.trend, item.action ({ label, to }, only with a count, unless `always`) or item.detail
export default function DashboardCard({ item }) {
  const Icon = item.icon;
  const hasCount = item.count !== undefined && item.value === undefined;
  // Colour and actions only when there is something there: "0 pending" is fine
  const needsAction = hasCount && item.count > 0;
  const tone = needsAction && item.tone ? `tone-${item.tone}` : "";

  return (
    <article className={`card dashboard-card ${tone}`}>
      <header className="flex items-start justify-between gap-3">
        <h3 className="dashboard-card-title">{item.title}</h3>
        {Icon && (
          // Pulled into the corner so the card's label row keeps its height
          <span className="hex-frame -mt-1 -mr-1 h-8.25 w-7.5 shrink-0">
            <Icon className="dashboard-card-icon" aria-hidden="true" />
          </span>
        )}
      </header>
      {/* Text cards show a value (e.g. an event name) instead of a count */}
      {hasCount ? (
        <p className="dashboard-card-number">{item.count}</p>
      ) : (
        <p className="dashboard-card-value">{item.value}</p>
      )}
      {item.trend ? (
        <Trend trend={item.trend} />
      ) : item.action && (needsAction || item.action.always) ? (
        <Link to={item.action.to} className="dashboard-card-action">
          {item.action.label}
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        item.detail && <p className="dashboard-card-context">{item.detail}</p>
      )}
    </article>
  );
}
