import { requestWhere } from "./filters.js";
import type Database from "better-sqlite3";
import type { CustomerRequest } from "../../shared/requests.js";
import { requestSelect, type RequestRepository } from "./repository.js";

export function sqliteRequests(db: Database.Database): RequestRepository {
  return {
    async list(userId, filters = {}) {
      const { where, values } = requestWhere(filters, userId, "sqlite");
      return db.prepare(requestSelect + where + " ORDER BY customer_requests.id DESC")
        .all(...values) as CustomerRequest[];
    },
    async find(id, userId) {
      const where = userId === undefined ? "" : " AND customer_requests.user_id = ?";
      return db.prepare(requestSelect + " WHERE customer_requests.id = ?" + where)
        .get(id, ...(userId === undefined ? [] : [userId])) as CustomerRequest | undefined;
    },
    async create(userId, input) {
      const result = db.prepare("INSERT INTO customer_requests (user_id, subject, message) VALUES (?, ?, ?)")
        .run(userId, input.subject, input.message);
      return (await this.find(Number(result.lastInsertRowid)))!;
    },
    async updateStatus(id, status) {
      const result = db.prepare(`UPDATE customer_requests SET status = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).run(status, id);
      return result.changes ? this.find(id) : undefined;
    },
  };
}
