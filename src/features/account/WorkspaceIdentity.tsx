import type { CurrentUser } from "./auth";
import "./workspace.css";

export function WorkspaceIdentity({ user }: { user: CurrentUser }) {
  const label = user.role === "admin" ? "Administrator" : user.role === "employee" ? "Regular Employee" : "Customer";
  return <div className="workspace-identity" aria-label="Signed-in account">
    <span className="workspace-role">{label}</span>
    <span className="workspace-account">{user.name}<span>{user.email}</span></span>
  </div>;
}
