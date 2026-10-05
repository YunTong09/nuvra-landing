import type Database from "better-sqlite3";
import type { Project, ProjectDetails, ProjectMemberDetails, ProjectRepository, ProjectScope } from "../projects.js";

type ProjectRow = Project & { client_name: string; client_email: string };
const projectSelect = `SELECT projects.*, clients.name AS client_name, clients.email AS client_email
  FROM projects JOIN clients ON clients.id = projects.client_id`;
const memberSelect = `SELECT project_members.project_id, project_members.user_id, users.name, users.email
  FROM project_members JOIN users ON users.id = project_members.user_id`;

// Scope is a database selection condition, not a substitute for route authorization.
function scopeCondition(scope: ProjectScope) {
  return scope.kind === "assigned" ? {
    sql: " AND EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = ?)",
    values: [scope.user_id],
  } : { sql: "", values: [] };
}

export function sqliteProjects(db: Database.Database): ProjectRepository {
  function members(id: number): ProjectMemberDetails[] {
    return db.prepare(memberSelect + " WHERE project_id = ? ORDER BY user_id").all(id) as ProjectMemberDetails[];
  }
  function details(row: ProjectRow): ProjectDetails {
    const assigned = members(row.id);
    return { ...row, members: assigned, member_ids: assigned.map(member => member.user_id) };
  }
  function find(id: number, scope: ProjectScope = { kind: "all" }) {
    const condition = scopeCondition(scope);
    const row = db.prepare(projectSelect + " WHERE projects.id = ?" + condition.sql)
      .get(id, ...condition.values) as ProjectRow | undefined;
    return row ? details(row) : undefined;
  }
  function replaceMembers(id: number, userIds: number[]) {
    db.prepare("DELETE FROM project_members WHERE project_id = ?").run(id);
    const insert = db.prepare("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)");
    for (const userId of new Set(userIds)) insert.run(id, userId);
  }

  return {
    async list(scope) {
      return db.transaction(() => {
        const condition = scopeCondition(scope);
        const rows = db.prepare(projectSelect + " WHERE 1 = 1" + condition.sql + " ORDER BY projects.id DESC")
          .all(...condition.values) as ProjectRow[];
        return rows.map(details);
      })();
    },
    async find(id, scope) {
      return db.transaction(() => find(id, scope))();
    },
    async create(input, memberIds = []) {
      return db.transaction(() => {
        const result = db.prepare(`INSERT INTO projects (client_id, name, description, status)
          VALUES (?, ?, ?, ?)`).run(input.client_id, input.name, input.description ?? "", input.status ?? "not_started");
        const id = Number(result.lastInsertRowid);
        replaceMembers(id, memberIds);
        return find(id)!;
      }).immediate();
    },
    async update(id, changes, scope) {
      return db.transaction(() => {
        if (!find(id, scope)) return undefined;
        const fields = (["client_id", "name", "description", "status"] as const)
          .filter(field => changes[field] !== undefined);
        if (fields.length) {
          db.prepare(`UPDATE projects SET ${fields.map(field => `${field} = ?`).join(", ")},
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
            .run(...fields.map(field => changes[field]), id);
        }
        return find(id, scope);
      }).immediate();
    },
    async delete(id) {
      // The database cascades deletion to project_members, preserving users and clients.
      return db.prepare("DELETE FROM projects WHERE id = ?").run(id).changes > 0;
    },
    async getMembers(id) { return members(id); },
    async setMembers(id, memberIds) {
      return db.transaction(() => {
        if (!find(id)) return undefined;
        replaceMembers(id, memberIds);
        db.prepare("UPDATE projects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(id);
        return find(id);
      }).immediate();
    },
  };
}
