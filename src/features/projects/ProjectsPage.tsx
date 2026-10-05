import { useEffect, useState } from "react";
import { Brand } from "../../components/Icon";
import { WorkspaceIdentity } from "../account/WorkspaceIdentity";
import { currentUser, spacePath, type CurrentUser } from "../account/auth";
import { apiRequest } from "../../lib/http";
import { ProjectForm } from "./ProjectForm";
import { ProjectList } from "./ProjectList";
import { useProjects } from "./useProjects";
import type { Project } from "./types";
import "./projects.css";

function ProjectsPanel({ canManage }: { canManage: boolean }) {
  const data = useProjects();
  // undefined closes the form; null creates a new project.
  const [editing, setEditing] = useState<Project | null | undefined>(undefined);
  const openForm = (project: Project | null) => { data.clearFeedback(); setEditing(project); };
  return <>
    {data.error && <p className="auth-error" role="alert">{data.error}</p>}
    {data.success && <p role="status">{data.success}</p>}
    {canManage && editing === undefined && <button className="button" disabled={data.loading || data.busy || !!data.loadError} onClick={() => openForm(null)}>Create project</button>}
    {canManage && editing !== undefined && <ProjectForm key={editing?.id ?? "new"} project={editing} busy={data.busy}
      onCancel={() => { setEditing(undefined); data.clearFeedback(); }}
      onSave={async input => {
        const saved = await data.save(editing?.id ?? null, input);
        if (saved) setEditing(undefined);
        return saved;
      }} />}
    {data.loading ? <p role="status">Loading projects…</p> : data.loadError ? <div role="alert">
      <p className="auth-error">{data.loadError}</p><button className="button" onClick={() => void data.reload()}>Retry</button>
    </div> : data.projects.length === 0 ? <p>{canManage ? "No projects yet. Create a project to get started." : "No projects have been assigned to you yet."}</p> :
      <ProjectList projects={data.projects} canManage={canManage} busy={data.busy || editing !== undefined}
        onEdit={openForm} onDelete={project => { void data.remove(project); }} onStatus={data.updateStatus} />}
  </>;
}

export function ProjectsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    currentUser().then(found => {
      if (!active) return;
      if (!found) { window.location.replace("/login"); return; }
      setUser(found); setChecking(false);
    });
    return () => { active = false; };
  }, []);
  async function logout() {
    setLoggingOut(true); setError("");
    try { await apiRequest<null>("auth/logout", "POST"); window.location.assign("/"); }
    catch { setError("Could not log out. Please try again."); setLoggingOut(false); }
  }
  if (checking) return <main className="section"><div className="container"><p role="status">Checking access…</p></div></main>;
  if (!user || (user.role !== "admin" && user.role !== "employee")) return <main className="section"><div className="container">
    <h1>Staff access required</h1><p>Your account cannot access project management.</p>
    <a className="button" href={spacePath(user)}>Go to my workspace</a>
  </div></main>;
  return <div className={`staff-workspace staff-workspace--${user.role}`}>
    <a className="skip-link" href="#projects-content">Skip to content</a>
    <header className="site-header"><div className="container nav-wrap">
      <a href="/" aria-label="Nuvra home"><Brand /></a>
      <WorkspaceIdentity user={user} />
      <nav className="account-nav" aria-label="Project navigation">
        <a href={spacePath(user)}>My workspace</a><a href="/">Website</a>
        <button onClick={logout} disabled={loggingOut}>Log out</button>
      </nav>
    </div></header>
    <main id="projects-content" className="section admin-page"><div className="container admin-container projects-page">
      <p className="section-label">PROJECT MANAGEMENT</p>
      <h1>Projects</h1>
      <p className="admin-description">{user.role === "admin" ? "Manage client projects and assign your team." : "View your assigned projects and update their progress."}</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <ProjectsPanel canManage={user.role === "admin"} />
    </div></main>
  </div>;
}
