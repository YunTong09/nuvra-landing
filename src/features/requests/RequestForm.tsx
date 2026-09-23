import { useState, type FormEvent } from "react";
import { submitRequest } from "./api";
import type { CustomerRequest } from "../../../shared/requests";

export function RequestForm({ onSubmitted }: { onSubmitted: (request: CustomerRequest) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const request = await submitRequest({ subject, message });
      setSubject("");
      setMessage("");
      setNotice(`Request #${request.id} submitted. Its status is Pending.`);
      onSubmitted(request);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not submit your request.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="contact-form request-form" onSubmit={submit}>
    <h3>Submit a request</h3>
    <p>Tell us what you need help with. You do not need to know which service to choose.</p>
    <fieldset disabled={busy} className="contact-fields">
      <label className="contact-message" htmlFor="request-subject">Subject
        <input id="request-subject" value={subject} onChange={event => setSubject(event.target.value)}
          placeholder="e.g. I need help organising my daily tasks"
          required maxLength={150} />
      </label>
      <label className="contact-message" htmlFor="request-message">Request details
        <textarea id="request-message" value={message} onChange={event => setMessage(event.target.value)}
          placeholder="Describe the problem and what you would like help with. For example: I often forget important tasks and would like help setting up a daily routine and reminders."
          required maxLength={5000} rows={5} />
      </label>
    </fieldset>
    <button className="button" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <p role="status">{notice}</p>
  </form>;
}
