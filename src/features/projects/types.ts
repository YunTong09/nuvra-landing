export const projectStatuses = ["Not Started", "In Progress", "Completed", "On Hold"] as const;
export type ProjectStatus = typeof projectStatuses[number];
export type ProjectMember = { project_id: number; user_id: number; name: string; email: string };
export type EmployeeOption = { id: number; name: string; email: string; role: "employee" };
export type Project = {
  id: number;
  name: string;
  description: string;
  client_id: number;
  client_name: string;
  client_email: string;
  status: ProjectStatus;
  member_ids: number[];
  members: ProjectMember[];
  created_at: string;
  updated_at: string;
};
export type ProjectInput = Pick<Project, "name" | "description" | "client_id" | "status" | "member_ids">;
