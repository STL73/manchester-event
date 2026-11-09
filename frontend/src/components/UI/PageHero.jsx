// A photo card with the page's heading over it and the honeycomb texture; without
// an image, a plain card. `compact` keeps the page's task near the top
export default function PageHero({ eyebrow, title, titleId, intro, image, compact = false }) {
  const classes = ["page-hero", compact && "page-hero-compact", !image && "page-hero-plain"];

  return (
    <section className={classes.filter(Boolean).join(" ")} aria-labelledby={titleId}>
      {/* A real <img> rather than a CSS background, so it loads first and
          keeps its dimensions */}
      {image && (
        <img
          className="page-hero-img"
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          style={image.position ? { objectPosition: image.position } : undefined}
          fetchPriority="high"
        />
      )}
      <div className="honeycomb-texture" aria-hidden="true" />
      <div className="page-hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-hero-title" id={titleId}>
          {title}
        </h1>
        <p className="page-hero-intro">{intro}</p>
      </div>
    </section>
  );
}
