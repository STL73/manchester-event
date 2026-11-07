import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { chartColours, chartOpacity } from "../../data/analyticsData";
import { themeColour } from "../../lib/themeColour";

// Sideways bar chart of counts, one row per name; the height grows with the rows
export default function CountBarChart({ rows, valueLabel = "events" }) {
  const axisTick = { fill: chartColours.axisText, fontSize: 12 };
  const accent = themeColour("accent");

  return (
    <ResponsiveContainer width="100%" height={rows.length * 32 + 32}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke={chartColours.grid} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={170}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chartColours.grid }}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: chartColours.accent, fillOpacity: chartOpacity.barHover }}
          content={<ChartTooltip valueLabel={valueLabel} getColour={() => accent} />}
        />
        {/* Thin bars, 4px rounded end, square at the baseline */}
        <Bar dataKey="count" fill={accent} maxBarSize={18} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
