import { AccountOverview } from "./AccountOverview";
import { NewRequestPage } from "../features/requests/NewRequestPage";
import { RequestsPanel } from "../features/requests/RequestsPanel";
import { useEffect, useState } from "react";
import { apiRequest, currentUser, type CurrentUser } from "../auth";
import { Brand } from "./Icon";
import { AccountDetailsForm } from "./AccountDetailsForm";

type AccountView = "dashboard" | "profile" | "new-request";

export function AccountPage({ view = "dashboard" }: { view?: AccountView }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    currentUser().then(found => {
      if (!active) return;
      if (!found) { window.location.replace("/login"); return; }
      if (found.role === "admin") { window.location.replace("/admin"); return; }
      if (window.location.pathname === "/account") {
        window.history.replaceState(null, "", "/dashboard");
      }
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

  const title = view === "profile" ? "Edit profile" : view === "new-request" ? "Submit a new request" :
    user ? `Hello, ${user.name}` : "Your dashboard";

  return <>
    <a className="skip-link" href="#account-content">Skip to content</a>
    <header className="site-header"><div className="container nav-wrap">
      <a href="/" aria-label="Nuvra home"><Brand /></a>
      <nav className="account-nav" aria-label="Account navigation">
        <a href="/">Website</a>
        <button onClick={logout} disabled={!user}>Log out</button>
      </nav>
    </div></header>
    <main id="account-content" className="section account-page">
      <div className="container account-container">
        <p className="section-label">YOUR NUVRA DASHBOARD</p>
        <h1>{title}</h1>
        {view !== "dashboard" && <p><a href="/dashboard">← Back to dashboard</a></p>}
        {!user ? <p role="status" className="account-loading">Checking your account…</p> : <>
          {view === "dashboard" && <><AccountOverview user={user} /><RequestsPanel /></>}
          {view === "profile" && <>
            <AccountDetailsForm user={user} onSaved={setUser} />
            <p><a href="/dashboard">Done / return to dashboard</a></p>
          </>}
          {view === "new-request" && <NewRequestPage />}
        </>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
    </main>
  </>;
}
