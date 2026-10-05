import { WorkspaceIdentity } from "../account/WorkspaceIdentity";
import { useEffect, useState } from "react";
import { AccountOverview } from "../../components/AccountOverview";
import { Brand } from "../../components/Icon";
import { apiRequest } from "../../lib/http";
import { currentUser, spacePath, type CurrentUser } from "../account/auth";
import { RequestsPanel } from "../requests/RequestsPanel";

export function EmployeePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    currentUser().then(found => {
      if (!active) return;
      if (found?.role !== "employee") {
        window.location.replace(spacePath(found));
        return;
      }
      setUser(found);
    });
    return () => { active = false; };
  }, []);

  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      await apiRequest<null>("auth/logout", "POST");
      window.location.assign("/");
    } catch {
      setError("Could not log out. Please try again.");
      setLoggingOut(false);
    }
  }

  return <div className="staff-workspace staff-workspace--employee">
    <a className="skip-link" href="#employee-content">Skip to content</a>
    <header className="site-header"><div className="container nav-wrap">
      <a href="/" aria-label="Nuvra home"><Brand /></a>
      {user && <WorkspaceIdentity user={user} />}
      <nav className="account-nav" aria-label="Employee navigation">
        <a href="/projects">Projects</a>
        <a href="/">Website</a>
        <button onClick={logout} disabled={!user || loggingOut}>Log out</button>
      </nav>
    </div></header>
    <main id="employee-content" className="section account-page">
      <div className="container account-container">
        <p className="section-label">NUVRA EMPLOYEE</p>
        <h1>Employee workspace</h1>
        {!user ? <p role="status">Checking access…</p> : <>
          <AccountOverview user={user} />
          <RequestsPanel canManageRequests />
        </>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
    </main>
  </div>;
}
