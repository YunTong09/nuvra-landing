import { services, type Service } from "../data/companyData";
import { Icon } from "./Icon";

function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="service-card">
      <Icon name={service.icon} />
      <h3>{service.title}</h3>
      <p>{service.description}</p>
    </article>
  );
}

export function Services() {
  return (
    <section id="services" className="section services">
      <div className="container">
        <div className="section-heading">
          <p className="section-label">SERVICES</p>
          <h2>How we can help</h2>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
