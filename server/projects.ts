import { Router, type Express, type ErrorRequestHandler } from "express";

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

// Routes derive this scope from the authenticated user, never request input.
// Admin receives all projects; employee receives only assigned projects.
export type ProjectScope = { kind: "all" } | { kind: "assigned"; user_id: number };

export interface ProjectRepository {
  list(scope: ProjectScope): Promise<ProjectDetails[]>;
  find(id: number, scope: ProjectScope): Promise<ProjectDetails | undefined>;
  // Creation and initial membership must be saved in one transaction.
  create(input: ProjectInput, memberIds?: number[]): Promise<ProjectDetails>;
  update(id: number, changes: ProjectChanges, scope: ProjectScope, memberIds?: number[]): Promise<ProjectDetails | undefined>;
  delete(id: number): Promise<boolean>;
  getMembers(id: number): Promise<ProjectMemberDetails[]>;
  // Replace membership atomically; duplicate users must not create duplicate rows.
  setMembers(id: number, memberIds: number[]): Promise<ProjectDetails | undefined>;
}

// IDs are restricted to the integer range shared by SQLite and PostgreSQL.
function validId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2147483647;
}

const writableFields = new Set(["name", "description", "client_id", "status", "member_ids"]);
function validateProjectBody(body: unknown, partial: boolean): string | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Send a JSON object.";
  const fields = body as Record<string, unknown>;
  if (Object.keys(fields).some(key => !writableFields.has(key)))
    return "Only name, description, client_id, status, and member_ids may be supplied.";
  if (partial && Object.keys(fields).length === 0) return "Supply at least one project field to update.";
  if (!partial || Object.hasOwn(fields, "name")) {
    if (typeof fields.name !== "string" || !fields.name.trim() || fields.name.trim().length > 200)
      return "Enter a project name of 1–200 characters.";
  }
  if (!partial || Object.hasOwn(fields, "client_id")) {
    if (!validId(fields.client_id)) return "Choose a valid client ID.";
  }
  if (Object.hasOwn(fields, "description") &&
      (typeof fields.description !== "string" || fields.description.length > 10000))
    return "Description must be text of at most 10000 characters.";
  if (Object.hasOwn(fields, "status") && !projectStatuses.includes(fields.status as ProjectStatus))
    return "Status must be not_started, in_progress, completed, or on_hold.";
  if (Object.hasOwn(fields, "member_ids") &&
      (!Array.isArray(fields.member_ids) || fields.member_ids.length > 1000 || !fields.member_ids.every(validId)))
    return "Member IDs must be an array of up to 1000 valid user IDs.";
  return undefined;
}

function projectChanges(body: Record<string, unknown>): ProjectChanges {
  const changes: ProjectChanges = {};
  if (Object.hasOwn(body, "name")) changes.name = (body.name as string).trim();
  if (Object.hasOwn(body, "description")) changes.description = body.description as string;
  if (Object.hasOwn(body, "client_id")) changes.client_id = body.client_id as number;
  if (Object.hasOwn(body, "status")) changes.status = body.status as ProjectStatus;
  return changes;
}

export function registerProjects(app: Express, repository: ProjectRepository) {
  const router = Router();
  // Existing app-level authentication validates the session and sets this user.
  router.use((_req, res, next) => {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ error: "Please log in." });
    if (user.role !== "admin" && user.role !== "employee")
      return res.status(403).json({ error: "Project access requires a staff account." });
    const scope: ProjectScope = user.role === "admin"
      ? { kind: "all" } : { kind: "assigned", user_id: user.id };
    res.locals.projectScope = scope;
    next();
  });
  router.param("id", (_req, res, next, id: string) => {
    if (!/^[1-9]\d*$/.test(id) || !validId(Number(id)))
      return res.status(400).json({ error: "Invalid project ID." });
    next();
  });

  router.get("/", async (_req, res) => {
    res.json(await repository.list(res.locals.projectScope));
  });
  router.get("/:id", async (req, res) => {
    const project = await repository.find(Number(req.params.id), res.locals.projectScope);
    if (!project) return res.status(404).json({ error: "Project not found." });
    res.json(project);
  });
  router.post("/", async (req, res) => {
    if (res.locals.user.role !== "admin")
      return res.status(403).json({ error: "Administrator access required." });
    const error = validateProjectBody(req.body, false);
    if (error) return res.status(400).json({ error });
    const project = await repository.create(projectChanges(req.body) as ProjectInput, req.body.member_ids);
    res.status(201).json(project);
  });
  router.patch("/:id", async (req, res) => {
    // Reject the entire request rather than silently discarding forbidden fields.
    if (res.locals.user.role !== "admin" && req.body && typeof req.body === "object" &&
        !Array.isArray(req.body) && Object.keys(req.body).some(key => key !== "status"))
      return res.status(403).json({ error: "Team members may only update project status." });
    const error = validateProjectBody(req.body, true);
    if (error) return res.status(400).json({ error });
    // The repository saves fields and member replacements in one transaction.
    const project = await repository.update(Number(req.params.id), projectChanges(req.body), res.locals.projectScope, req.body.member_ids);
    if (!project) return res.status(404).json({ error: "Project not found." });
    res.json(project);
  });
  router.delete("/:id", async (req, res) => {
    if (res.locals.user.role !== "admin")
      return res.status(403).json({ error: "Administrator access required." });
    if (!await repository.delete(Number(req.params.id)))
      return res.status(404).json({ error: "Project not found." });
    res.status(204).end();
  });

  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error?.code === "SQLITE_CONSTRAINT_FOREIGNKEY" || error?.code === "23503")
      return res.status(400).json({ error: "The client or one of the assigned users does not exist." });
    if (["SQLITE_CONSTRAINT_CHECK", "SQLITE_CONSTRAINT_NOTNULL", "23514", "23502", "22P02", "22003"].includes(error?.code))
      return res.status(400).json({ error: "Invalid project data." });
    if (["SQLITE_CONSTRAINT_UNIQUE", "SQLITE_CONSTRAINT_PRIMARYKEY", "23505"].includes(error?.code))
      return res.status(409).json({ error: "The project or member assignment already exists." });
    res.status(500).json({ error: "Could not complete the project request. Please try again." });
  };
  router.use(handleError);
  app.use("/api/projects", router);
}
