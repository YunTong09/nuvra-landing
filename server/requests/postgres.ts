import type { Pool } from "pg";
import { requestSelect, type RequestRepository } from "./repository.ts";

export function postgresRequests(db: Pool): RequestRepository {
  return {
    async list(userId) {
      const where = userId === undefined ? "" : " WHERE customer_requests.user_id = $1";
      return (await db.query(requestSelect + where + " ORDER BY customer_requests.id DESC",
        userId === undefined ? [] : [userId])).rows;
    },
    async find(id, userId) {
      const where = userId === undefined ? "" : " AND customer_requests.user_id = $2";
      return (await db.query(requestSelect + " WHERE customer_requests.id = $1" + where,
        userId === undefined ? [id] : [id, userId])).rows[0];
    },
    async create(userId, input) {
      const result = await db.query(`INSERT INTO customer_requests (user_id, subject, message)
        VALUES ($1, $2, $3) RETURNING id`, [userId, input.subject, input.message]);
      return (await this.find(result.rows[0].id))!;
    },
    async updateStatus(id, status) {
      const result = await db.query(`UPDATE customer_requests SET status = $1,
        updated_at = now() WHERE id = $2 RETURNING id`, [status, id]);
      return result.rowCount ? this.find(id) : undefined;
    },
  };
}
