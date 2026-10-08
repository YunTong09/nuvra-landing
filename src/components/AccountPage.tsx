import { WorkspaceIdentity } from "../features/account/WorkspaceIdentity";
import { AccountOverview } from "./AccountOverview";
import { NewRequestPage } from "../features/requests/NewRequestPage";
import { RequestsPanel } from "../features/requests/RequestsPanel";
import { useEffect, useState } from "react";
import { apiRequest } from "../lib/http";
import { currentUser, spacePath, type CurrentUser } from "../features/account/auth";
import { Brand } from "./Icon";
import { AccountDetailsForm } from "./AccountDetailsForm";
import { DocumentsPage } from "../features/documents/DocumentsPage";

type AccountView = "dashboard" | "profile" | "new-request";

export function AccountPage({ view = "dashboard" }: { view?: AccountView }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"requests" | "documents">("requests");
  const [documentsOpened, setDocumentsOpened] = useState(false);

  function selectTab(next: "requests" | "documents") {
    setTab(next);
    if (next === "documents") setDocumentsOpened(true);
  }

  useEffect(() => {
    let active = true;
    currentUser().then(found => {
      if (!active) return;
      if (!found) { window.location.replace("/login"); return; }
      if (found.role === "admin") { window.location.replace("/admin"); return; }
      if (found.role === "employee" && view !== "profile") {
        window.location.replace(spacePath(found)); return;
      }
      if (window.location.pathname === "/account") {
        window.history.replaceState(null, "", "/dashboard");
      }
      setUser(found);
    }).catch(failure => {
      if (active) setError(failure instanceof Error ? failure.message : "Could not check your account. Please refresh to retry.");
    });
    return () => { active = false; };
  }, [view]);

  async function logout() {
    try {
      await apiRequest<null>("auth/logout", "POST");
      window.location.assign("/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not log out. Please try again.");
    }
  }

  const title = view === "profile" ? "Edit profile" : view === "new-request" ? "Submit a new request" :
    "My Space";

  return <div className={user?.role === "employee" ? "staff-workspace staff-workspace--employee" : undefined}>
    <a className="skip-link" href="#account-content">Skip to content</a>
    <header className="site-header"><div className="container nav-wrap">
      <a href="/" aria-label="Nuvra home"><Brand /></a>
      {user?.role === "employee" && <WorkspaceIdentity user={user} />}
      <nav className="account-nav" aria-label="Account navigation">
        <a href="/">Website</a>
        <button onClick={logout} disabled={!user}>Log out</button>
      </nav>
    </div></header>
    <main id="account-content" className="section account-page">
      <div className="container account-container">
        <p className="section-label">YOUR NUVRA DASHBOARD</p>
        <h1>{title}</h1>
        {view !== "dashboard" && <p><a href={spacePath(user)}>← Back to dashboard</a></p>}
        {!user ? error ? null : <p role="status" className="account-loading">Checking your account…</p> : <>
          {view === "dashboard" && <>
            <AccountOverview user={user} />
            <style>{`
              .space-tabs { display: flex; gap: .5rem; margin: 1.5rem 0; border-bottom: 1px solid #78878366; }
              .space-tabs button { font: inherit; color: inherit; cursor: pointer; padding: .8rem 1rem; border: 0; border-bottom: 3px solid transparent; background: transparent; transition: background .2s, border-color .2s; }
              .space-tabs button[aria-selected="true"] { border-bottom-color: #70d9b7; background: #70d9b722; }
              .space-panel:not([hidden]) { animation: space-tab-enter .2s ease-out; }
              @keyframes space-tab-enter { from { opacity: .4; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
              @media (prefers-reduced-motion: reduce) { .space-tabs button { transition: none; } .space-panel:not([hidden]) { animation: none; } }
            `}</style>
            <div className="space-tabs" role="tablist" aria-label="My Space sections">
              {(["requests", "documents"] as const).map(value => <button key={value} type="button"
                role="tab" id={`space-tab-${value}`} aria-controls={`space-panel-${value}`}
                aria-selected={tab === value} tabIndex={tab === value ? 0 : -1}
                onClick={() => selectTab(value)} onKeyDown={event => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const next = event.key === "Home" ? "requests" : event.key === "End" ? "documents"
                    : value === "requests" ? "documents" : "requests";
                  selectTab(next);
                  document.getElementById(`space-tab-${next}`)?.focus();
                }}>{value === "requests" ? "My Requests" : "My Documents"}</button>)}
            </div>
            <div className="space-panel" role="tabpanel" id="space-panel-requests"
              aria-labelledby="space-tab-requests" hidden={tab !== "requests"} tabIndex={0}>
              <RequestsPanel />
            </div>
            <div className="space-panel" role="tabpanel" id="space-panel-documents"
              aria-labelledby="space-tab-documents" hidden={tab !== "documents"} tabIndex={0}>
              {documentsOpened && <DocumentsPage embedded />}
            </div>
          </>}
          {view === "profile" && <>
            <AccountDetailsForm user={user} onSaved={setUser} />
            <p><a href={spacePath(user)}>Done / return to dashboard</a></p>
          </>}
          {view === "new-request" && <NewRequestPage />}
        </>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
    </main>
  </div>;
}
