import { ProjectsWorkspace } from "../features/projects/ProjectsWorkspace";
import { RequestsPanel } from "../features/requests/RequestsPanel";
import { useEffect, useState } from "react";
import { ToolsAdmin } from "../features/tools/ToolsAdmin";
import { ClientsAdmin } from "../features/clients/ClientsAdmin";
import { SubscriptionsAdmin } from "../features/subscriptions/SubscriptionsAdmin";
import { Brand } from "./Icon";
import { apiRequest } from "../lib/http";
import { WorkspaceIdentity } from "../features/account/WorkspaceIdentity";
import { currentUser, type CurrentUser } from "../features/account/auth";

export function Admin() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    let active = true;
    currentUser().then(user => {
      if (!active) return;
      if (!user) { window.location.replace("/login"); return; }
      setUser(user);
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
    <div className="staff-workspace staff-workspace--admin">
      <a className="skip-link" href="#admin-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container nav-wrap">
          <a href="/" aria-label="Nuvra home">
            <Brand />
          </a>
          {user && <WorkspaceIdentity user={user} />}
          <nav className="account-nav" aria-label="Admin navigation">
            <a href="/">Website →</a>
            <button type="button" onClick={logout} disabled={loggingOut}>Log out</button>
          </nav>
        </div>
      </header>
      <main id="admin-content" className="section admin-page">
        <div className="container admin-container">
          {logoutError && <p className="auth-error" role="alert">{logoutError}</p>}
          <p className="section-label">ADMINISTRATOR WORKSPACE</p>
          <h1>Manage Nuvra</h1>
          <p className="admin-description">
            Manage your tools, clients, subscriptions, customer requests, and projects.
          </p>
          <nav className="admin-navigation" aria-label="Admin tables">
            <a
              href="/admin"
              aria-current={
                section !== "clients" && section !== "subscriptions" && section !== "requests" && section !== "projects"
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
            <a href="/admin?table=projects" aria-current={section === "projects" ? "page" : undefined}>Projects</a>
          </nav>
          {section === "projects" ? (
            <ProjectsWorkspace canManage />
          ) : section === "requests" ? (
            <RequestsPanel canManageRequests />
          ) : section === "clients" ? (
            <ClientsAdmin />
          ) : section === "subscriptions" ? (
            <SubscriptionsAdmin />
          ) : (
            <ToolsAdmin />
          )}
        </div>
      </main>
    </div>
  );
}
