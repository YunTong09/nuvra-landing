import { useEffect, useState } from "react";
import { getProjectDashboard } from "./api";
import type { ProjectDashboardData } from "./types";

const statistics: { key: keyof ProjectDashboardData["stats"]; label: string }[] = [
  { key: "totalProjects", label: "Total Projects" },
  { key: "activeProjects", label: "In Progress" },
  { key: "completedProjects", label: "Completed Projects" },
  { key: "notStartedProjects", label: "Not Started" },
  { key: "onHoldProjects", label: "On Hold" },
];

export function ProjectDashboard() {
  const [data, setData] = useState<ProjectDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProjectDashboard().then(result => {
      if (active) setData(result);
    }).catch(() => {
      if (active) setError("Could not load the project dashboard. Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  if (loading) return <p role="status">Loading project dashboard…</p>;
  if (error) return <div role="alert">
    <p className="auth-error">{error}</p>
    <button className="button" onClick={() => setAttempt(value => value + 1)}>Retry</button>
  </div>;
  if (!data) return null;

  return <>
    <dl className="project-statistics" aria-label="Project statistics">
      {statistics.map(({ key, label }) => <div className="project-card project-statistic" key={key}>
        <dt>{label}</dt>
        <dd>{data.stats[key]}</dd>
      </div>)}
    </dl>
    <section aria-labelledby="project-overview-heading">
      <h2 id="project-overview-heading">Project overview</h2>
      {data.projects.length === 0 ? <p>No projects are currently available to you.</p> :
        <div className="project-list">{data.projects.map(project => <article className="project-card" key={project.id}>
          <h3>{project.name}</h3>
          <p><strong>Client:</strong> {project.client_name}</p>
          <p><strong>Status:</strong> {project.status}</p>
          <p><strong>Assigned team members:</strong></p>
          {project.members.length ? <ul>{project.members.map(member => <li key={member.user_id}>{member.name}</li>)}</ul> :
            <p>No team members assigned.</p>}
          {project.updated_at && <p>Updated <time dateTime={project.updated_at}>{new Date(project.updated_at).toLocaleString()}</time></p>}
        </article>)}</div>}
    </section>
  </>;
}
