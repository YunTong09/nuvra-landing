import { useState, type FormEvent } from "react";

export function CTA() {
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");

    const fields = new FormData(event.currentTarget);

    const inquiry = {
      name: fields.get("name"),
      email: fields.get("email"),
      subject: fields.get("subject"),
      message: fields.get("message"),
    };

    try {
      const response = await fetch("https://voltix-api.onrender.com/api/contact", {
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
      event.currentTarget.reset();
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
        <form onSubmit={handleSubmit}>
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" type="text" required />

          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" required />

          <label htmlFor="contact-subject">Subject</label>
          <input id="contact-subject" name="subject" type="text" required />

          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows={4} required></textarea>

          <button type="submit">Send inquiry</button>
          {statusMessage && <p role="status">{statusMessage}</p>}
        </form>
      </div>
    </section>
  );
}
