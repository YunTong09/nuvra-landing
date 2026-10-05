import { apiRequest } from "../../lib/http";
import type { EmployeeOption, Project, ProjectDashboardData, ProjectInput, ProjectStatus } from "./types";

export const listProjects = () => apiRequest<Project[]>("projects");
export const getProjectDashboard = () => apiRequest<ProjectDashboardData>("projects/dashboard");
export const listEmployeeOptions = () => apiRequest<EmployeeOption[]>("users/options");
export const saveProject = (id: number | null, input: ProjectInput) =>
  apiRequest<Project>(id === null ? "projects" : `projects/${id}`, id === null ? "POST" : "PATCH", input);
export const updateProjectStatus = (id: number, status: ProjectStatus) =>
  apiRequest<Project>(`projects/${id}`, "PATCH", { status });
export const deleteProject = (id: number) => apiRequest<null>(`projects/${id}`, "DELETE");
