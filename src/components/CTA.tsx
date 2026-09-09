import { useState, type FormEvent } from "react";

export function CTA() {
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");

    const form = event.currentTarget;
    const fields = new FormData(form);

    const inquiry = {
      name: fields.get("name"),
      email: fields.get("email"),
      subject: fields.get("subject"),
      message: fields.get("message"),
    };

    try {
      const response = await fetch("https://nuvra-landing.onrender.com/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inquiry),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send inquiry");
      }

      setStatusMessage(result.message);
      form.reset();
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not send inquiry. Please try again.",
      );
    }
  }

  return (
    <section id="contact" className="section contact">
      <div className="container contact-content">
        <p className="section-label">CONTACT</p>
        <h2>Have a project in mind?</h2>
        <p>Get in touch to discuss your project.</p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-fields">
            <label htmlFor="contact-name">
              Name
              <input id="contact-name" name="name" type="text" required />
            </label>

            <label htmlFor="contact-email">
              Email
              <input id="contact-email" name="email" type="email" required />
            </label>

            <label htmlFor="contact-subject">
              Subject
              <input id="contact-subject" name="subject" type="text" required />
            </label>

            <label className="contact-message" htmlFor="contact-message">
              Message
              <textarea id="contact-message" name="message" rows={4} required></textarea>
            </label>
          </div>

          <button className="contact-submit" type="submit">Send inquiry</button>
          {statusMessage && <p role="status">{statusMessage}</p>}
        </form>
      </div>
    </section>
  );
}
