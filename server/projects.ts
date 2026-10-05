import { Router, type Express } from "express";

export const projectStatuses = ["not_started", "in_progress", "completed", "on_hold"] as const;
export type ProjectStatus = typeof projectStatuses[number];

export interface Project {
  id: number;
  client_id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

// Represents a row in the project_members junction table.
export interface ProjectMember {
  project_id: number;
  user_id: number;
}

export interface ProjectMemberDetails extends ProjectMember {
  name: string;
  email: string;
}

export interface ProjectDetails extends Project {
  client_name: string;
  client_email: string;
  member_ids: number[];
  members: ProjectMemberDetails[];
}

export type ProjectInput = Pick<Project, "client_id" | "name"> &
  Partial<Pick<Project, "description" | "status">>;
export type ProjectChanges = Partial<ProjectInput>;

// Future routes derive this scope from the authenticated user, never request input.
// Admin receives all projects; employee receives only assigned projects.
export type ProjectScope = { kind: "all" } | { kind: "assigned"; user_id: number };

export interface ProjectRepository {
  list(scope: ProjectScope): Promise<ProjectDetails[]>;
  find(id: number, scope: ProjectScope): Promise<ProjectDetails | undefined>;
  // Creation and initial membership must be saved in one transaction.
  create(input: ProjectInput, memberIds?: number[]): Promise<ProjectDetails>;
  update(id: number, changes: ProjectChanges, scope: ProjectScope): Promise<ProjectDetails | undefined>;
  delete(id: number): Promise<boolean>;
  getMembers(id: number): Promise<ProjectMemberDetails[]>;
  // Replace membership atomically; duplicate users must not create duplicate rows.
  setMembers(id: number, memberIds: number[]): Promise<ProjectDetails | undefined>;
}

export function projectOperationNotImplemented(): never {
  throw new Error("Project repository operations are not implemented yet (Task 11.1 scaffold).");
}

export function registerProjects(app: Express, _repository: ProjectRepository) {
  const router = Router();
  // App-level auth already validates the session and sets res.locals.user.
  router.use((_req, res, next) => {
    if (!res.locals.user) return res.status(401).json({ error: "Please log in." });
    next();
  });

  // Task 11.2: use the injected repository in validated handlers.
  // Admin: create/edit/delete, choose clients, and assign members.
  // Employee: assigned-project reads and explicitly allowed content/status changes.
  // Ordinary user accounts must not gain internal project access.
  // No operation is enabled until these authorization rules are implemented.
  router.use((_req, res) => {
    res.status(501).json({ error: "Project management is not implemented yet." });
  });
  app.use("/api/projects", router);
}
