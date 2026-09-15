import { useState, type FormEvent } from "react";
import { apiRequest, type CurrentUser } from "../auth";
import { Brand } from "./Icon";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">(
    window.location.pathname.startsWith("/register") ? "register" : "login",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") || "");
    const email = String(values.get("email") || "");
    const password = String(values.get("password") || "");
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ user: CurrentUser }>(`auth/${mode}`, "POST",
        mode === "register" ? { name, email, password } : { email, password });
      window.location.assign(result.user.role === "admin" ? "/admin" : "/account");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#auth-content">Skip to content</a>
      <header className="site-header"><div className="container nav-wrap">
        <a href="/" aria-label="Nuvra home"><Brand /></a>
        <a href="/">Back to website →</a>
      </div></header>
      <main id="auth-content" className="section auth-page">
        <div className="container auth-container">
          <p className="section-label">YOUR SPACE AT NUVRA</p>
          <h1>{mode === "register" ? "Create an account" : "Welcome back"}</h1>
          <p>{mode === "register" ? "Join Nuvra and keep your account in one place." :
            "Log in to your Nuvra account."}</p>
          <form className="contact-form auth-form" onSubmit={submit}>
            <fieldset className="contact-fields auth-fields" disabled={busy}>
              {mode === "register" && <label htmlFor="auth-name">Name
                <input id="auth-name" name="name" autoComplete="name" required maxLength={100} />
              </label>}
              <label htmlFor="auth-email">Email
                <input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} />
              </label>
              <label htmlFor="auth-password">Password
                <input id="auth-password" name="password" type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required minLength={mode === "register" ? 12 : undefined} maxLength={128} />
              </label>
            </fieldset>
            {mode === "register" && <p className="auth-hint">Use at least 12 characters.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="contact-submit" type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "register" ? "Already have an account?" : "New to Nuvra?"} {" "}
            <button type="button" onClick={() => {
              const next = mode === "register" ? "login" : "register";
              setMode(next); setError("");
              window.history.replaceState(null, "", next === "register" ? "/register" : "/login");
            }}>{mode === "register" ? "Log in" : "Create an account"}</button>
          </p>
        </div>
      </main>
    </>
  );
}
