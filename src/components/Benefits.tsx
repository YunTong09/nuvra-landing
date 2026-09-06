import { benefits } from "../data/companyData";
export function Benefits() {
  return (
    <section id="why-us" className="section benefits">
      <div className="container benefits-grid">
        <div className="benefits-intro">
          <p className="eyebrow">03 / THE DIFFERENCE</p>
          <h2>
            More than a vendor.
            <br />
            <span>Part of your team.</span>
          </h2>
          <p>
            Great outcomes come from good relationships.
            <br />
            Here’s what working with us looks like.
          </p>
          <div className="partnership-note">
            <span aria-hidden="true">↗</span>
            <p>
              Small enough to care.
              <br />
              <strong>Experienced enough to deliver.</strong>
            </p>
          </div>
        </div>
        <div className="benefits-list">
          {benefits.map((benefit, index) => (
            <article key={benefit.title}>
              <span className="benefit-number">0{index + 1}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
