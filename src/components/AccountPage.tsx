import { useEffect, useState } from "react";
import { apiRequest, currentUser, type CurrentUser } from "../auth";
import { Brand } from "./Icon";

export function AccountPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    currentUser().then(found => {
      if (!active) return;
      if (!found) { window.location.replace("/login"); return; }
      setUser(found);
    });
    return () => { active = false; };
  }, []);

  async function logout() {
    try {
      await apiRequest<null>("auth/logout", "POST");
      window.location.assign("/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not log out. Please try again.");
    }
  }

  return <>
    <a className="skip-link" href="#account-content">Skip to content</a>
    <header className="site-header"><div className="container nav-wrap">
      <a href="/" aria-label="Nuvra home"><Brand /></a>
      <nav className="account-nav" aria-label="Account navigation">
        {user?.role === "admin" && <a href="/admin">Admin</a>}
        <a href="/">Website</a>
        <button onClick={logout} disabled={!user}>Log out</button>
      </nav>
    </div></header>
    <main id="account-content" className="section account-page">
      <div className="container account-container">
        <p className="section-label">YOUR NUVRA ACCOUNT</p>
        <h1>{user ? `Hello, ${user.name}` : "Your account"}</h1>
        {user ? <div className="account-card">
          <h2>Account details</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p>Your account is ready. Explore Nuvra's simple tools on the website.</p>
        </div> : <p role="status" className="account-loading">Checking your account…</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
    </main>
  </>;
}
