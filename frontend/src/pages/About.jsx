import Button from "../components/UI/Button";
import { aboutPageData } from "../data/aboutPageData";

const About = () => {
  const { title, introImage, outroImage, paragraphs, contact, socialLinks } =
    aboutPageData;

  return (
    <main>
      <section className="section-content" aria-labelledby="about-title">
        <div className="content-img-container about-image-container">
          <img
            className="content-img"
            src={introImage.src}
            alt={introImage.alt}
          />
        </div>

        <h1 className="section-title" id="about-title">
          {title}
        </h1>

        <div className="content-wrapper">
          {paragraphs.map((paragraph) => (
            <p className="content-p" key={paragraph}>
              {paragraph}
            </p>
          ))}

          <div className="content-btn-box">
            <Button to={contact.to} variant="primary" size="lg">
              <contact.icon aria-hidden="true" />
              {contact.label}
            </Button>
          </div>

          <p className="content-p">
            Connect with us via our social media links.
          </p>

          <div className="about-social-links" aria-label="Social media links">
            {socialLinks.map(({ label, icon: Icon, href }) => (
              <a
                className="about-social-link"
                href={href}
                aria-label={label}
                key={label}
              >
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className="content-img-container about-image-container">
          <img
            className="content-img"
            src={outroImage.src}
            alt={outroImage.alt}
          />
        </div>
      </section>
    </main>
  );
};

export default About;
