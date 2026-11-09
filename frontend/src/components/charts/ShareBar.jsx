function percent(count, total) {
  const share = Math.round((count / total) * 100);
  return share === 0 && count > 0 ? "<1" : share;
}

// One bar split into the shares of a whole, with a legend of counts and shares.
// `tones` colours each key; keys in `striped` (something switched off) are grey stripes
export default function ShareBar({ title, rows, tones, striped = [] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const toneClass = (row) =>
    `tone-${tones?.[row.key] ?? "accent"} ${striped.includes(row.key) ? "is-striped" : ""}`;

  return (
    <div className="share">
      {title && <p className="share-title">{title}</p>}
      <div className="share-bar">
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <span
              className={`share-part ${toneClass(row)}`}
              style={{ flexGrow: row.count }}
              key={row.key}
            />
          ))}
      </div>
      <ul className="share-legend">
        {rows.map((row) => (
          <li className={toneClass(row)} key={row.key}>
            <span className="share-key" />
            {row.label} <strong>{row.count}</strong>
            {total > 0 && <span>{percent(row.count, total)}%</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
