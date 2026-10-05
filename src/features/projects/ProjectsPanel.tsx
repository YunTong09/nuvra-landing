import { useState } from "react";
import { ProjectForm } from "./ProjectForm";
import { ProjectList } from "./ProjectList";
import { useProjects } from "./useProjects";
import type { Project } from "./types";

export function ProjectsPanel({ canManage }: { canManage: boolean }) {
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

