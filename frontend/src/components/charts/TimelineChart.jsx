import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColours } from "../../data/analyticsData";

const axisTick = { fill: chartColours.axisText, fontSize: 12 };
const seriesColours = { held: chartColours.held, scheduled: chartColours.scheduled };

function TimelineTooltip({ active, payload, series, valueLabel }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="chart-tooltip">
      {series.map(({ key, label }) => (
        <p className="chart-tooltip-value" key={key}>
          <span
            className="chart-tooltip-key"
            style={{ backgroundColor: seriesColours[key] }}
            aria-hidden="true"
          />
          {row[key]} {label.toLowerCase()} {valueLabel}
        </p>
      ))}
      <p className="chart-tooltip-label">{row.fullLabel ?? row.label}</p>
    </div>
  );
}

// Past and future on one axis: "held" bars in the accent, "scheduled" bars in
// a quieter step of the same hue, stacked so the current period shows both,
// with a "Today" line between them. `series` = [{ key, label }] in stack order.
export default function TimelineChart({ rows, series, todayLabel, valueLabel = "events" }) {
  const [lower, upper] = series;

  return (
    <div className="timeline-chart">
      {/* Two series, so a legend; identity also comes from position and the tooltip */}
      <ul className="chart-legend">
        {series.map(({ key, label }) => (
          <li key={key}>
            <span
              className="chart-legend-key"
              style={{ backgroundColor: seriesColours[key] }}
              aria-hidden="true"
            />
            {label}
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 20, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={chartColours.grid} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: chartColours.grid }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: chartColours.barHover }}
            content={<TimelineTooltip series={series} valueLabel={valueLabel} />}
          />
          {todayLabel && (
            <ReferenceLine
              x={todayLabel}
              stroke={chartColours.axisText}
              strokeDasharray="4 4"
              label={{ value: "Today", position: "top", fill: chartColours.axisText, fontSize: 12 }}
            />
          )}
          {/* Only the top segment of each stack gets the 4px rounded end */}
          <Bar dataKey={lower.key} stackId="timeline" maxBarSize={24} fill={seriesColours[lower.key]}>
            {rows.map((row) => (
              <Cell key={row.key} radius={row[upper.key] > 0 ? 0 : [4, 4, 0, 0]} />
            ))}
          </Bar>
          <Bar
            dataKey={upper.key}
            stackId="timeline"
            maxBarSize={24}
            fill={seriesColours[upper.key]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
