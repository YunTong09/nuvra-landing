import { useEffect, useRef, useState, type FormEvent } from "react";
import { listClients } from "../clients/api";
import type { Client } from "../clients/types";
import { listEmployeeOptions } from "./api";
import { projectStatuses, type EmployeeOption, type Project, type ProjectInput, type ProjectStatus } from "./types";

type Props = {
  project: Project | null;
  busy: boolean;
  onSave: (input: ProjectInput) => Promise<boolean>;
  onCancel: () => void;
};

export function ProjectForm({ project, busy, onSave, onCancel }: Props) {
  const firstInput = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [members, setMembers] = useState<number[]>(project?.member_ids ?? []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    Promise.all([listClients(), listEmployeeOptions()]).then(([clientOptions, employeeOptions]) => {
      if (!active) return;
      setClients(clientOptions); setEmployees(employeeOptions);
    }).catch(() => { if (active) setError("Could not load clients and team members. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => { if (!loading && !error) firstInput.current?.focus(); }, [loading, error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) { firstInput.current?.setCustomValidity("Enter a project name."); firstInput.current?.reportValidity(); return; }
    await onSave({ name, description: String(data.get("description") ?? ""), client_id: Number(data.get("client_id")),
      status: data.get("status") as ProjectStatus, member_ids: members });
  }
  // Preserve existing assignments even if a member's role has since changed.
  const unavailable = project?.members.filter(member => !employees.some(employee => employee.id === member.user_id)) ?? [];
  return <form className="contact-form admin-form" onSubmit={submit} aria-busy={busy || loading}>
    <h2>{project ? "Edit project" : "Create project"}</h2>
    {loading && <p role="status">Loading clients and team members…</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" className="admin-cancel" onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
    {!loading && !error && <>
      {!clients.length && <p>Add a client in <a href="/admin?table=clients">client management</a> before creating a project.</p>}
      <fieldset className="contact-fields" disabled={busy || !clients.length}>
        <label htmlFor="project-name">Project name
          <input ref={firstInput} id="project-name" name="name" defaultValue={project?.name ?? ""} required maxLength={200}
            placeholder="e.g. Company website redesign" onInput={event => event.currentTarget.setCustomValidity("")} />
        </label>
        <label htmlFor="project-description">Description
          <textarea id="project-description" name="description" defaultValue={project?.description ?? ""} maxLength={10000}
            rows={4} placeholder="Describe the project goals and work to be completed." />
        </label>
        <label htmlFor="project-client">Client
          <select id="project-client" name="client_id" required defaultValue={project?.client_id ?? ""}>
            <option value="" disabled>Choose a client</option>
            {clients.map(client => <option key={client.id} value={client.id}>{client.name} — {client.email}</option>)}
          </select>
        </label>
        <label htmlFor="project-status">Status
          <select id="project-status" name="status" defaultValue={project?.status ?? "Not Started"}>
            {projectStatuses.map(status => <option key={status}>{status}</option>)}
          </select>
        </label>
        <fieldset className="project-member-options">
          <legend>Team members</legend>
          <p>Select team members, or leave the project unassigned.</p>
          {!employees.length && <p>No employees are available to assign.</p>}
          {employees.map(employee => <label key={employee.id} className="project-member-option">
            <input type="checkbox" checked={members.includes(employee.id)} onChange={event => setMembers(ids => event.target.checked ? [...ids, employee.id] : ids.filter(id => id !== employee.id))} />
            <span>{employee.name} — {employee.email}</span>
          </label>)}
          {unavailable.map(member => <label key={member.user_id} className="project-member-option">
            <input type="checkbox" checked={members.includes(member.user_id)} onChange={event => setMembers(ids => event.target.checked ? [...ids, member.user_id] : ids.filter(id => id !== member.user_id))} />
            <span>{member.name} — {member.email} (existing assignment; no longer an employee)</span>
          </label>)}
        </fieldset>
      </fieldset>
    </>}
    <div className="admin-actions">
      <button className="button" disabled={busy || loading || !!error || !clients.length}>{busy ? "Saving…" : "Save project"}</button>
      <button type="button" className="admin-cancel" disabled={busy} onClick={onCancel}>Cancel</button>
    </div>
  </form>;
}
