import { spacePath } from "../auth";
import { useCurrentUser } from "../useCurrentUser";

export function Hero() {
  const user = useCurrentUser();
  return (
    <section className="hero section" id="home">
      <div className="container">
        <div className="hero-copy">
          <h1>Make everyday tasks feel lighter.</h1>
          <p>
            Simple tools that help you organise tasks, priorities, and routines
            without adding more complexity.
          </p>
          <div className="button-row">
            <a className="button" href="#services">
              Explore tools
            </a>
            <a className="text-link" href="#about">
              How it works →
            </a>
          </div>
          {user === null && <div className="button-row hero-account-actions">
            <a className="button" href="/register">Create account</a>
            <a className="text-link" href="/login">Already have an account? Log in →</a>
          </div>}
          {user && <div className="button-row hero-account-actions">
            <a className="text-link" href={spacePath(user)}>Go to My space →</a>
          </div>}
        </div>
      </div>
    </section>
  );
}
