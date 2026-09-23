import { RequestsPanel } from "../features/requests/RequestsPanel";
import { useEffect, useState } from "react";
import { ToolsAdmin } from "../features/tools/ToolsAdmin";
import { ClientsAdmin } from "../features/clients/ClientsAdmin";
import { SubscriptionsAdmin } from "../features/subscriptions/SubscriptionsAdmin";
import { Brand } from "./Icon";
import { apiRequest } from "../lib/http";
import { currentUser } from "../features/account/auth";

export function Admin() {
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    let active = true;
    currentUser().then(user => {
      if (!active) return;
      if (!user) { window.location.replace("/login"); return; }
      setAccess(user.role === "admin" ? "allowed" : "denied");
    });
    return () => { active = false; };
  }, []);
  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await apiRequest<null>("auth/logout", "POST");
      window.location.assign("/");
    } catch {
      setLogoutError("Could not log out. Please try again.");
      setLoggingOut(false);
    }
  }
  if (access === "checking") return <main className="section"><div className="container"><p role="status">Checking access…</p></div></main>;
  if (access === "denied") return <main className="section"><div className="container">
    <h1>Administrator access required</h1><p>Your account cannot manage company records.</p>
    <a className="button" href="/dashboard">Go to my dashboard</a>
  </div></main>;
  const section =
    new URLSearchParams(window.location.search).get("table") || "tools";
  return (
    <>
      <a className="skip-link" href="#admin-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container nav-wrap">
          <a href="/" aria-label="Nuvra home">
            <Brand />
          </a>
          <nav className="account-nav" aria-label="Admin navigation">
            <a href="/">Website →</a>
            <button type="button" onClick={logout} disabled={loggingOut}>Log out</button>
          </nav>
        </div>
      </header>
      <main id="admin-content" className="section admin-page">
        <div className="container admin-container">
          {logoutError && <p className="auth-error" role="alert">{logoutError}</p>}
          <p className="section-label">CONTENT MANAGEMENT</p>
          <h1>Manage Nuvra</h1>
          <p className="admin-description">
            Manage your tools, clients, subscriptions, and customer requests.
          </p>
          <nav className="admin-navigation" aria-label="Admin tables">
            <a
              href="/admin"
              aria-current={
                section !== "clients" && section !== "subscriptions" && section !== "requests"
                  ? "page"
                  : undefined
              }
            >
              Tools
            </a>
            <a
              href="/admin?table=clients"
              aria-current={section === "clients" ? "page" : undefined}
            >
              Clients
            </a>
            <a
              href="/admin?table=subscriptions"
              aria-current={section === "subscriptions" ? "page" : undefined}
            >
              Subscriptions
            </a>
            <a href="/admin?table=requests" aria-current={section === "requests" ? "page" : undefined}>Requests</a>
          </nav>
          {section === "requests" ? (
            <RequestsPanel isAdmin />
          ) : section === "clients" ? (
            <ClientsAdmin />
          ) : section === "subscriptions" ? (
            <SubscriptionsAdmin />
          ) : (
            <ToolsAdmin />
          )}
        </div>
      </main>
    </>
  );
}
