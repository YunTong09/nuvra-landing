import Database from "better-sqlite3";
import { Pool } from "pg";
import { initializePostgres } from "./postgres/schema.ts";
import { migrateSqliteUserRoles } from "./sqlite/user-roles.ts";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("Usage: npm run employee:grant -- name@example.com");

// Only existing customer accounts are eligible, so this cannot demote an admin.
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await initializePostgres(pool);
    const result = await pool.query(
      "UPDATE users SET role = 'employee' WHERE lower(email) = $1 AND role IN ('user', 'employee')", [email]);
    if (!result.rowCount) throw new Error("No eligible account found. Register a customer account first.");
  } finally { await pool.end(); }
} else {
  const db = new Database(process.env.DATABASE_PATH || "server/voltix.db", { fileMustExist: true });
  try {
    migrateSqliteUserRoles(db);
    const result = db.prepare(
      "UPDATE users SET role = 'employee' WHERE email = ? AND role IN ('user', 'employee')").run(email);
    if (!result.changes) throw new Error("No eligible account found. Register a customer account first.");
  } finally { db.close(); }
}
console.log(`Employee access granted to ${email}.`);
