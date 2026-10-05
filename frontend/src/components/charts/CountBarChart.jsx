import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { chartColours } from "../../data/analyticsData";

const axisTick = { fill: chartColours.axisText, fontSize: 12 };

// Column chart for counts per category/status/location.
// One colour by default; pass `colours` ({ key: hex }) when colour means
// something (e.g. status), otherwise every bar uses the accent.
// `horizontal` lays the bars sideways, one row per name, for long lists with
// long names (Events by Category); the height grows with the number of rows.
export default function CountBarChart({
  rows,
  colours,
  valueLabel = "events",
  horizontal = false,
}) {
  const fill = (row) => colours?.[row.key] ?? chartColours.accent;
  const tooltip = (
    <Tooltip
      cursor={{ fill: chartColours.barHover }}
      content={<ChartTooltip valueLabel={valueLabel} getColour={fill} />}
    />
  );

  if (horizontal) {
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
          {tooltip}
          {/* Thin bars, 4px rounded end, square at the baseline */}
          <Bar dataKey="count" maxBarSize={18} radius={[0, 4, 4, 0]}>
            {rows.map((row) => (
              <Cell key={row.key} fill={fill(row)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={chartColours.grid} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chartColours.grid }}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
        />
        {tooltip}
        {/* Thin bars (max 24px), 4px rounded top, square at the baseline */}
        <Bar dataKey="count" maxBarSize={24} radius={[4, 4, 0, 0]}>
          {rows.map((row) => (
            <Cell key={row.key} fill={fill(row)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
