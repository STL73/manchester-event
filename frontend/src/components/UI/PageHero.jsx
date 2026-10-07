// A photo card with the page's heading over it and the honeycomb texture on
// the photo. About uses the tall version; Explore Events and Contact the
// compact one, so the page's task stays near the top of the screen. Without
// an image (FAQs, Privacy, Terms) it's a plain card with the texture
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
        <p className="page-hero-eyebrow">{eyebrow}</p>
        <h1 className="page-hero-title" id={titleId}>
          {title}
        </h1>
        <p className="page-hero-intro">{intro}</p>
      </div>
    </section>
  );
}
