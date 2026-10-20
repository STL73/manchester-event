import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { chartColours, chartOpacity } from "../../data/analyticsData";
import { themeColour } from "../../lib/themeColour";

const GLOW_RADIUS = 12;

// The hovered point: a faint accent glow around a 6px dot, and a thin line
// from the bottom of the glow down to the x-axis, so the point's date is easy
// to find without a crosshair cutting through the whole chart.
// Recharts passes cx/cy; usePlotArea() gives the bottom of the plot.
function HoverPoint({ cx, cy, colour }) {
  const plot = usePlotArea();
  if (cx == null || cy == null || !plot) return null;
  const axisY = plot.y + plot.height;

  return (
    <g>
      {axisY > cy + GLOW_RADIUS && (
        <line
          x1={cx}
          y1={cy + GLOW_RADIUS}
          x2={cx}
          y2={axisY}
          stroke={colour}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      )}
      <circle cx={cx} cy={cy} r={GLOW_RADIUS} fill={colour} fillOpacity={0.2} />
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={colour}
        stroke={chartColours.surface}
        strokeWidth={2}
      />
    </g>
  );
}

// Single-series count over time: 2px line with a 10% wash and dots with a
// surface ring. Hovering a point shows HoverPoint and the tooltip.
// `tone` colours it from a theme token (failed sign-ins are danger). `smooth`
// curves the line and drops the dots, for a shape read at a glance (Saves).
// `callout` ({ key, text }) labels one point: the latest month, or a spike
export default function TrendChart({
  rows,
  valueLabel = "events",
  tone = "accent",
  smooth = false,
  callout,
}) {
  const axisTick = { fill: chartColours.axisText, fontSize: 12 };
  const colour = themeColour(tone);
  const marked = callout && rows.find((row) => row.key === callout.key);

  return (
    <ResponsiveContainer width="100%" height={240}>
      {/* A callout needs room above the top of the plot: the point it labels
          is often the highest */}
      <AreaChart data={rows} margin={{ top: marked ? 32 : 16, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={chartColours.grid} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chartColours.grid }}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={false}
          content={
            <ChartTooltip
              valueLabel={valueLabel}
              getColour={() => colour}
            />
          }
        />
        <Area
          type={smooth ? "monotone" : "linear"}
          dataKey="count"
          stroke={colour}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={colour}
          fillOpacity={chartOpacity.areaFill}
          dot={
            !smooth && {
              r: 4,
              fill: colour,
              stroke: chartColours.surface,
              strokeWidth: 2,
            }
          }
          activeDot={<HoverPoint colour={colour} />}
        />
        {marked && (
          <ReferenceDot
            x={marked.label}
            y={marked.count}
            r={4}
            fill={colour}
            stroke={chartColours.surface}
            strokeWidth={2}
            label={{
              value: callout.text,
              position: "top",
              offset: 10,
              // Ends at the point, so a callout on the last one stays inside
              textAnchor: "end",
              dx: 6,
              fill: themeColour("foreground"),
              fontSize: 12,
            }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
