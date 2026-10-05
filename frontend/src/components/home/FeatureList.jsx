export default function FeatureList({ features, layout = "column" }) {
  return (
    <div className={`content-items-${layout}`}>
      {features.map(({ icon: Icon, title, description }) => (
        <article className="content-box" key={title}>
          <h3 className="content-sub">
            <Icon className="content-icon" aria-hidden="true" />
            {title}
          </h3>
          <p className="content-p">{description}</p>
        </article>
      ))}
    </div>
  );
}
