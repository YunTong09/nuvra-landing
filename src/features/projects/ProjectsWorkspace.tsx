import { ProjectDashboard } from "./ProjectDashboard";
import { ProjectsPanel } from "./ProjectsPanel";
import "./projects.css";

export function ProjectsWorkspace({ canManage }: { canManage: boolean }) {
  const managing = new URLSearchParams(window.location.search).get("view") === "projects";
  const base = canManage ? "/admin?table=projects" : "/employee?section=projects";
  return <section className="projects-page" aria-labelledby="workspace-projects-heading">
    <h2 id="workspace-projects-heading">Projects</h2>
    <nav className="admin-navigation" aria-label="Project views">
      <a href={base} aria-current={!managing ? "page" : undefined}>Overview</a>
      <a href={`${base}&view=projects`} aria-current={managing ? "page" : undefined}>{canManage ? "Manage projects" : "My projects"}</a>
    </nav>
    {managing ? <ProjectsPanel canManage={canManage} /> : <ProjectDashboard />}
  </section>;
}
