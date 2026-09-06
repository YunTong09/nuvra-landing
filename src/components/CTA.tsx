import { useRef, useState } from "react";
import { Icon } from "./Icon";
export function CTA() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reviewed, setReviewed] = useState(false);
  return (
    <section id="contact" className="section contact">
      <div className="container contact-panel">
        <div>
          <p className="eyebrow">04 / LET’S MAKE IT HAPPEN</p>
          <h2>
            Something great
            <br />
            starts with a conversation.
          </h2>
          <p>
            Have an idea, a challenge, or a “what if”?
            <br />
            We’d love to hear what you have in mind.
          </p>
        </div>
        <div className="contact-action">
          <button
            className="button button-light"
            onClick={() => {
              setReviewed(false);
              dialog.current?.showModal();
            }}
          >
            Tell us about your project <Icon name="arrow" />
          </button>
          <span>No big pitch. Just a good first conversation.</span>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="contact-dialog"
        aria-labelledby="enquiry-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="dialog-close"
          aria-label="Close project enquiry"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <p className="eyebrow">LET’S TALK</p>
        <h2 id="enquiry-title">Your next big idea.</h2>
        <p>
          This is a portfolio demo. Try the enquiry below; your details stay on
          this page and nothing is sent.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setReviewed(true);
          }}
          onChange={() => setReviewed(false)}
        >
          <label>
            Your name
            <input name="name" autoComplete="name" required maxLength={100} />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            What would you like to build?
            <textarea name="project" required rows={4} maxLength={2000} />
          </label>
          <button className="button" type="submit">
            Preview enquiry <Icon name="arrow" />
          </button>
          <p className="form-status" role="status">
            {reviewed
              ? "Your enquiry is ready. This demo has not sent or saved your information."
              : "Demo only — no message will be sent."}
          </p>
        </form>
      </dialog>
    </section>
  );
}
