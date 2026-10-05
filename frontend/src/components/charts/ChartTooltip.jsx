// Recharts tooltip in the same style as the button Tooltip: value first
// (the reader already knows the series and wants the number), label second.
// `getColour(row)` gives the key colour for the hovered bar or point.
export default function ChartTooltip({ active, payload, getColour, valueLabel }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-value">
        <span
          className="chart-tooltip-key"
          style={{ backgroundColor: getColour(row) }}
          aria-hidden="true"
        />
        {row.count} {valueLabel}
      </p>
      <p className="chart-tooltip-label">{row.fullLabel ?? row.label}</p>
    </div>
  );
}
