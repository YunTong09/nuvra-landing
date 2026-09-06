import { services, type Service } from "../data/companyData";
import { Icon } from "./Icon";
function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="service-card">
      <div className="service-card-top">
        <span className="service-icon">
          <Icon name={service.icon} />
        </span>
        <span className="card-number">{service.number}</span>
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <div className="service-detail">
        {service.detail}
        <Icon name="arrow" />
      </div>
    </article>
  );
}
export function Services() {
  return (
    <section id="services" className="section services">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / WHAT WE DO</p>
            <h2>
              The right expertise.
              <br />
              For your next move.
            </h2>
          </div>
          <p>
            From the first sketch to the final deployment,
            <br className="desktop-break" /> we connect the dots between vision
            and execution.
          </p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <ServiceCard key={service.number} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
