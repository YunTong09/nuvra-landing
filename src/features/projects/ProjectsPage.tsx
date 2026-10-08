import { useEffect, useState } from "react";
import { currentUser, spacePath } from "../account/auth";

// Preserve bookmarked project URLs while keeping all work in the existing workspace.
export function ProjectsPage() {
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    currentUser().then(user => {
      if (!active) return;
      const view = new URLSearchParams(window.location.search).get("view") === "dashboard" ? "dashboard" : "projects";
      const destination = user?.role === "admin" ? "/admin?table=projects" : user?.role === "employee" ? "/employee?section=projects" : null;
      window.location.replace(destination ? `${destination}&view=${view}` : spacePath(user));
    }).catch(failure => {
      if (active) setError(failure instanceof Error ? failure.message : "Could not check your account. Please refresh to retry.");
    });
    return () => { active = false; };
  }, []);
  return <main className="section"><div className="container">{error ? <p role="alert">{error}</p> : <p role="status">Opening your workspace…</p>}</div></main>;
}
