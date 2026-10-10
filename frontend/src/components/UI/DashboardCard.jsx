import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

// Stat card: small label (and quiet icon) on top, one big figure, and at
// most one line of context at the bottom. The context is, in order:
// - item.trend  = { current, previous, label, note }: arrow from current vs
//   previous, "+4 in the last 30 days", with the note as a tooltip
// - item.action = { label, to }: a link to where the count is dealt with,
//   only shown when there is something to deal with (count > 0), unless
//   action.always is set (e.g. "Choose your interests" on a zero)
// - item.detail: plain text, e.g. the date on text cards
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

export default function DashboardCard({ item }) {
  const Icon = item.icon;
  const hasCount = item.count !== undefined && item.value === undefined;
  // Colour and actions only when there is something there: "0 pending" is fine
  const needsAction = hasCount && item.count > 0;
  const tone = needsAction ? (item.tone ?? "") : "";

  return (
    <article className={`dashboard-card ${tone}`}>
      <header className="dashboard-card-header">
        <h3 className="dashboard-card-title">{item.title}</h3>
        {Icon && <Icon className="dashboard-card-icon" aria-hidden="true" />}
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
