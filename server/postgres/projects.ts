import { defaultProjectStatus } from "../projects.js";
import type { Pool, PoolClient } from "pg";
import type { Project, ProjectDetails, ProjectMemberDetails, ProjectRepository, ProjectScope } from "../projects.js";

type ProjectRow = Omit<Project, "created_at" | "updated_at"> & {
  created_at: Date | string;
  updated_at: Date | string;
  client_name: string;
  client_email: string;
};
const projectSelect = `SELECT projects.*, clients.name AS client_name, clients.email AS client_email
  FROM projects JOIN clients ON clients.id = projects.client_id`;
const memberSelect = `SELECT project_members.project_id, project_members.user_id, users.name, users.email
  FROM project_members JOIN users ON users.id = project_members.user_id`;

function scopeCondition(scope: ProjectScope, parameter: number) {
  return scope.kind === "assigned" ? {
    sql: ` AND EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = $${parameter})`,
    values: [scope.user_id],
  } : { sql: "", values: [] };
}

export function postgresProjects(pool: Pool): ProjectRepository {
  async function transaction<T>(work: (db: PoolClient) => Promise<T>, readOnly = false): Promise<T> {
    const db = await pool.connect();
    try {
      // Detail reads use a single snapshot for the project and its members.
      await db.query(readOnly ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" : "BEGIN");
      const result = await work(db);
      await db.query("COMMIT");
      return result;
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally { db.release(); }
  }
  async function members(db: Pool | PoolClient, id: number): Promise<ProjectMemberDetails[]> {
    return (await db.query(memberSelect + " WHERE project_id = $1 ORDER BY user_id", [id])).rows;
  }
  async function details(db: PoolClient, row: ProjectRow): Promise<ProjectDetails> {
    const assigned = await members(db, row.id);
    return {
      ...row,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
      members: assigned, member_ids: assigned.map(member => member.user_id),
    };
  }
  async function find(db: PoolClient, id: number, scope: ProjectScope = { kind: "all" }) {
    const condition = scopeCondition(scope, 2);
    const result = await db.query<ProjectRow>(projectSelect + " WHERE projects.id = $1" + condition.sql,
      [id, ...condition.values]);
    return result.rows[0] ? details(db, result.rows[0]) : undefined;
  }
  async function replaceMembers(db: PoolClient, id: number, userIds: number[]) {
    await db.query("DELETE FROM project_members WHERE project_id = $1", [id]);
    for (const userId of new Set(userIds)) {
      await db.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)", [id, userId]);
    }
  }

  return {
    async list(scope) {
      return transaction(async db => {
        const condition = scopeCondition(scope, 1);
        const result = await db.query<ProjectRow>(projectSelect + " WHERE 1 = 1" + condition.sql + " ORDER BY projects.id DESC",
          condition.values);
        const projects: ProjectDetails[] = [];
        for (const row of result.rows) projects.push(await details(db, row));
        return projects;
      }, true);
    },
    async find(id, scope) { return transaction(db => find(db, id, scope), true); },
    async create(input, memberIds = []) {
      return transaction(async db => {
        const result = await db.query(`INSERT INTO projects (client_id, name, description, status)
          VALUES ($1, $2, $3, $4) RETURNING id`,
          [input.client_id, input.name, input.description ?? "", input.status ?? defaultProjectStatus]);
        const id = result.rows[0].id as number;
        await replaceMembers(db, id, memberIds);
        return (await find(db, id))!;
      });
    },
    async update(id, changes, scope, memberIds) {
      return transaction(async db => {
        // Serialize updates and member replacements before checking the supplied scope.
        const locked = await db.query("SELECT id FROM projects WHERE id = $1 FOR UPDATE", [id]);
        if (!locked.rowCount || !await find(db, id, scope)) return undefined;
        const fields = (["client_id", "name", "description", "status"] as const)
          .filter(field => changes[field] !== undefined);
        if (memberIds !== undefined) await replaceMembers(db, id, memberIds);
        if (fields.length || memberIds !== undefined) {
          await db.query(`UPDATE projects SET ${fields.map((field, index) => `${field} = $${index + 1}, `).join("")}
            updated_at = now() WHERE id = $${fields.length + 1}`,
            [...fields.map(field => changes[field]), id]);
        }
        return find(db, id, scope);
      });
    },
    async delete(id) {
      return (await pool.query("DELETE FROM projects WHERE id = $1", [id])).rowCount! > 0;
    },
    async getMembers(id) { return members(pool, id); },
    async setMembers(id, memberIds) {
      return transaction(async db => {
        const locked = await db.query("SELECT id FROM projects WHERE id = $1 FOR UPDATE", [id]);
        if (!locked.rowCount) return undefined;
        await replaceMembers(db, id, memberIds);
        await db.query("UPDATE projects SET updated_at = now() WHERE id = $1", [id]);
        return find(db, id);
      });
    },
  };
}
