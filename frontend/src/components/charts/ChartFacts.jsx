// A row of short figures over a chart or list: what it is, the number, and
// one line of context. A `tone` colours the figure (waiting = warning)
export default function ChartFacts({ facts }) {
  return (
    <dl className="chart-facts">
      {facts.map((fact) => (
        <div className={`chart-fact ${fact.tone ? `tone-${fact.tone}` : ""}`} key={fact.label}>
          <dt className="chart-fact-label">{fact.label}</dt>
          <dd className="chart-fact-value">{fact.value}</dd>
          {fact.detail && <dd className="chart-fact-detail">{fact.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
