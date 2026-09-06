import { statistics } from "../data/companyData";

export function Stats() {
  return (
    <section className="stats-section" aria-label="Nuvra in numbers">
      <div className="container">
        <dl className="stats-grid">
          {statistics.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
