import { useState, type FormEvent } from "react";
import { projectStatuses, type Project, type ProjectStatus } from "./types";

type Props = {
  projects: Project[];
  canManage: boolean;
  busy: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatus: (id: number, status: ProjectStatus) => Promise<boolean>;
};

function StatusForm({ project, busy, onStatus }: Pick<Props, "busy" | "onStatus"> & { project: Project }) {
  const [status, setStatus] = useState(project.status);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onStatus(project.id, status);
  }
  return <form className="project-status-form" onSubmit={submit}>
    <label htmlFor={`status-${project.id}`}>Update status
      <select id={`status-${project.id}`} value={status} disabled={busy}
        onChange={event => setStatus(event.target.value as ProjectStatus)}>
        {projectStatuses.map(value => <option key={value}>{value}</option>)}
      </select>
    </label>
    <button className="button" disabled={busy || status === project.status}>Save status</button>
  </form>;
}

export function ProjectList({ projects, canManage, busy, onEdit, onDelete, onStatus }: Props) {
  return <div className="project-list">{projects.map(project => <article className="project-card" key={project.id}>
    <h2>{project.name}</h2>
    <p><strong>Status:</strong> {project.status}</p>
    <p className="project-description">{project.description || "No description provided."}</p>
    <p><strong>Client:</strong> {project.client_name} — {project.client_email}</p>
    <h3>Assigned team members</h3>
    {project.members.length ? <ul>{project.members.map(member => <li key={member.user_id}>{member.name} — {member.email}</li>)}</ul> : <p>No team members assigned.</p>}
    <p>Updated <time dateTime={project.updated_at}>{new Date(project.updated_at).toLocaleString()}</time></p>
    {canManage ? <div className="admin-actions">
      <button className="button" disabled={busy} onClick={() => onEdit(project)}>Edit project</button>
      <button className="admin-cancel" disabled={busy} onClick={() => onDelete(project)}>Delete project</button>
    </div> : <StatusForm key={`${project.id}-${project.status}`} project={project} busy={busy} onStatus={onStatus} />}
  </article>)}</div>;
}
