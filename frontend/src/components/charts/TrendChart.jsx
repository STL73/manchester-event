import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { chartColours } from "../../data/analyticsData";

const axisTick = { fill: chartColours.axisText, fontSize: 12 };
const GLOW_RADIUS = 12;

// The hovered point: a faint accent glow around a 6px dot, and a thin line
// from the bottom of the glow down to the x-axis, so the point's date is easy
// to find without a crosshair cutting through the whole chart.
// Recharts passes cx/cy; usePlotArea() gives the bottom of the plot.
function HoverPoint({ cx, cy }) {
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
          stroke={chartColours.accent}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      )}
      <circle cx={cx} cy={cy} r={GLOW_RADIUS} fill={chartColours.accent} fillOpacity={0.2} />
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={chartColours.accent}
        stroke={chartColours.surface}
        strokeWidth={2}
      />
    </g>
  );
}

// Single-series count over time: 2px line with a 10% wash and dots with a
// surface ring. Hovering a point shows HoverPoint and the tooltip.
export default function TrendChart({ rows, valueLabel = "events" }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={rows} margin={{ top: 16, right: 16, bottom: 0, left: -16 }}>
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
              getColour={() => chartColours.accent}
            />
          }
        />
        <Area
          type="linear"
          dataKey="count"
          stroke={chartColours.accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={chartColours.areaFill}
          dot={{
            r: 4,
            fill: chartColours.accent,
            stroke: chartColours.surface,
            strokeWidth: 2,
          }}
          activeDot={<HoverPoint />}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
