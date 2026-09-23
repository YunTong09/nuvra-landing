import Database from "better-sqlite3";
import { Pool } from "pg";
import { initializePostgres } from "./postgres.ts";

const url = process.env.DATABASE_URL;
const sourcePath = process.env.DATABASE_PATH || "server/voltix.db";
if (!url) throw new Error("Set DATABASE_URL to your Neon PostgreSQL connection string.");

const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
const pool = new Pool({ connectionString: url });
try {
  await initializePostgres(pool);
  const target = await pool.connect();
  try {
    await target.query("BEGIN");
    const counts = await target.query(`SELECT
      (SELECT count(*) FROM inquiries) AS inquiries,
      (SELECT count(*) FROM tools) AS tools,
      (SELECT count(*) FROM clients) AS clients,
      (SELECT count(*) FROM subscriptions) AS subscriptions,
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM customer_requests) AS customer_requests`);
    const { inquiries, tools, clients, subscriptions, users, customer_requests } = counts.rows[0];
    if (Number(inquiries) || Number(clients) || Number(subscriptions) ||
        Number(users) || Number(customer_requests) || Number(tools) !== 4)
      throw new Error("Neon database already has records. Migration requires a new empty project with only the four starter tools.");
    await target.query("DELETE FROM tools");
    for (const table of ["inquiries", "tools", "clients", "subscriptions", "users", "customer_requests"] as const) {
      const exists = source.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
      if (!exists) continue;
      const rows = source.prepare(`SELECT * FROM ${table} ORDER BY id`).all() as Record<string, unknown>[];
      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        const values = columns.map(column => row[column]);
        await target.query(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`, values);
      }
      await target.query(`SELECT setval(pg_get_serial_sequence($1, 'id'),
        COALESCE((SELECT max(id) FROM ${table}), 1),
        EXISTS (SELECT 1 FROM ${table}))`, [table]);
      console.log(`${table}: ${rows.length} records copied`);
    }
    await target.query("COMMIT");
  } catch (error) {
    await target.query("ROLLBACK");
    throw error;
  } finally {
    target.release();
  }
} finally {
  source.close();
  await pool.end();
}
