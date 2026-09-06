import { Icon } from "./Icon";
function EngineeringVisual() {
  return (
    <div
      className="engineering-visual"
      role="img"
      aria-label="An abstract software architecture connecting design, development, and cloud infrastructure, with a successful deployment"
    >
      <div className="visual-top">
        <span>
          <i /> THE NUVRA APPROACH
        </span>
        <span>01 — 03</span>
      </div>
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="connection connection-one" />
      <div className="connection connection-two" />
      <div className="system-node design-node">
        <Icon name="design" />
        <span>Design</span>
      </div>
      <div className="system-node cloud-node">
        <Icon name="cloud" />
        <span>Scale</span>
      </div>
      <div className="core-platform">
        <div className="platform-layer layer-bottom" />
        <div className="platform-layer layer-middle" />
        <div className="platform-layer layer-top">
          <span>n</span>
        </div>
      </div>
      <div className="build-label">
        <Icon name="code" />
        <span>Built with purpose.</span>
      </div>
      <div className="deployment">
        <span className="deploy-check">
          <Icon name="check" />
        </span>
        <div>
          <strong>Ready for what’s next</strong>
          <span>Thoughtfully built. Seamlessly delivered.</span>
        </div>
        <span className="status-light" />
      </div>
      <div className="visual-bottom">
        <span>IDEA → EXPERIENCE → IMPACT</span>
        <span>↗</span>
      </div>
    </div>
  );
}
export function Hero() {
  return (
    <section className="hero section" id="home">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-line" /> TECHNOLOGY WITH PURPOSE
          </p>
          <h1>
            Good ideas.
            <br />
            Great software.
            <br />
            <span>Real impact.</span>
          </h1>
          <p className="hero-description">
            We help ambitious businesses turn their next big idea into
            thoughtful digital products. Designed for people. Built for growth.
          </p>
          <div className="button-row">
            <a className="button" href="#contact">
              Let’s build something <Icon name="arrow" />
            </a>
            <a className="text-link" href="#services">
              Explore our services <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="hero-note">
            <span className="check-ring">
              <Icon name="check" />
            </span>{" "}
            A small team. A shared commitment to doing it right.
          </div>
        </div>
        <EngineeringVisual />
      </div>
    </section>
  );
}
