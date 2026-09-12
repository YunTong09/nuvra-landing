import { API_URL } from "../api";
import { useState, type FormEvent } from "react";

export function CTA() {
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setStatusType("");

    const form = event.currentTarget;
    const fields = new FormData(form);

    const inquiry = {
      name: fields.get("name"),
      email: fields.get("email"),
      subject: fields.get("subject"),
      message: fields.get("message"),
    };

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inquiry),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send feedback");
      }

      setStatusMessage("Thank you for sharing your feedback.");
      setStatusType("success");
      form.reset();
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not send feedback. Please try again.",
      );
      setStatusType("error");
    }
  }

  return (
    <section id="contact" className="section contact">
      <div className="container contact-content">
        <p className="section-label">YOUR EXPERIENCE</p>
        <h2>What feels harder than it should?</h2>
        <p>
          Tell us what usually makes everyday organisation difficult. Your
          feedback helps us understand what kinds of tools could be more useful.
        </p>
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

            <label className="contact-message" htmlFor="contact-subject">
              What feels hardest to manage?
              <select
                id="contact-subject"
                name="subject"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="Too many tasks">Too many tasks</option>
                <option value="Not knowing what to do first">
                  Not knowing what to do first
                </option>
                <option value="Forgetting important things">
                  Forgetting important things
                </option>
                <option value="Keeping routines">Keeping routines</option>
                <option value="Feeling overwhelmed by information">
                  Feeling overwhelmed by information
                </option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="contact-message" htmlFor="contact-message">
              Tell us a little more
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
              ></textarea>
            </label>
          </div>

          <button className="contact-submit" type="submit">
            Share feedback
          </button>
          {statusMessage && (
            <p className={`contact-status ${statusType}`} role="status">
              {statusMessage}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
