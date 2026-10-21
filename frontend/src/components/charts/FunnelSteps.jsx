// Steps that each keep part of the one before (Sign-up funnel): the name, the
// figure, a share and a meter measured against the first step, so the drop
// between steps shows as the meters getting shorter. A `tone` colours a meter
export default function FunnelSteps({ steps }) {
  const first = Math.max(1, steps[0]?.count ?? 0);

  return (
    <ol className="funnel">
      {steps.map((step) => (
        <li className={`funnel-step ${step.tone ? `tone-${step.tone}` : ""}`} key={step.key}>
          <span className="funnel-label">
            {step.label}
            {step.share && <span className="funnel-share"> · {step.share}</span>}
          </span>
          <strong className="funnel-count">{step.count}</strong>
          <span className="meter">
            <span style={{ width: `${(step.count / first) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
