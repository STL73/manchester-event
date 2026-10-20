import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColours, chartOpacity, decisionSeries } from "../../data/analyticsData";
import { themeColour } from "../../lib/themeColour";

function DecisionTooltip({ active, payload, colours }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="chart-tooltip">
      {decisionSeries.map(({ key, label }) => (
        <p className="chart-tooltip-value" key={key}>
          <span
            className="chart-tooltip-key"
            style={{ backgroundColor: colours[key] }}
            aria-hidden="true"
          />
          {row[key]} {label.toLowerCase()}
        </p>
      ))}
      <p className="chart-tooltip-label">{row.fullLabel ?? row.label}</p>
    </div>
  );
}

// Review decisions per period (getDecisionRows): approved under rejected in
// one column, in their status colours, with the share rejected above it
export default function DecisionChart({ rows }) {
  const axisTick = { fill: chartColours.axisText, fontSize: 12 };
  const colours = Object.fromEntries(
    decisionSeries.map(({ key, tone }) => [key, themeColour(tone)]),
  );
  const [lower, upper] = decisionSeries;
  const labelled = rows.map((row) => ({
    ...row,
    // Only over columns with a rejection; "0%" over every other one is noise
    shareLabel: row.rejected ? `${row.rejectedShare}%` : "",
  }));

  return (
    <div>
      <ul className="chart-legend">
        {decisionSeries.map(({ key, label }) => (
          <li key={key}>
            <span
              className="chart-legend-key"
              style={{ backgroundColor: colours[key] }}
              aria-hidden="true"
            />
            {label}
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={labelled} margin={{ top: 20, right: 8, bottom: 0, left: -16 }}>
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
            cursor={{ fill: chartColours.accent, fillOpacity: chartOpacity.barHover }}
            content={<DecisionTooltip colours={colours} />}
          />
          {/* Only the top segment of each stack gets the 4px rounded end */}
          <Bar dataKey={lower.key} stackId="decisions" maxBarSize={24} fill={colours[lower.key]}>
            {labelled.map((row) => (
              <Cell key={row.key} radius={row[upper.key] > 0 ? 0 : [4, 4, 0, 0]} />
            ))}
          </Bar>
          <Bar
            dataKey={upper.key}
            stackId="decisions"
            maxBarSize={24}
            fill={colours[upper.key]}
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="shareLabel" position="top" fill={chartColours.axisText} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
