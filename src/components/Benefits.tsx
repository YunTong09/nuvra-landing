import { benefits } from "../data/companyData";

export function Benefits() {
  return (
    <section id="why-us" className="section benefits">
      <div className="container benefits-grid">
        <div>
          <p className="section-label">WHY NUVRA</p>
          <h2>Why work with us?</h2>
        </div>
        <div className="benefits-list">
          {benefits.map((benefit) => (
            <article key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
