import { useEffect } from "react";
import { currentUser, spacePath } from "../account/auth";

// Preserve bookmarked project URLs while keeping all work in the existing workspace.
export function ProjectsPage() {
  useEffect(() => {
    let active = true;
    currentUser().then(user => {
      if (!active) return;
      const view = new URLSearchParams(window.location.search).get("view") === "dashboard" ? "dashboard" : "projects";
      const destination = user?.role === "admin" ? "/admin?table=projects" : user?.role === "employee" ? "/employee?section=projects" : null;
      window.location.replace(destination ? `${destination}&view=${view}` : spacePath(user));
    });
    return () => { active = false; };
  }, []);
  return <main className="section"><div className="container"><p role="status">Opening your workspace…</p></div></main>;
}
