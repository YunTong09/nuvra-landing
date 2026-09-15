import Database from "better-sqlite3";
import { Pool } from "pg";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("Usage: npm run admin:promote -- name@example.com");

if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query("UPDATE users SET role = 'admin' WHERE lower(email) = $1", [email]);
    if (!result.rowCount) throw new Error("Account not found. Register first.");
  } finally { await pool.end(); }
} else {
  const db = new Database(process.env.DATABASE_PATH || "server/voltix.db", { fileMustExist: true });
  try {
    const result = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
    if (!result.changes) throw new Error("Account not found. Register first.");
  } finally { db.close(); }
}
console.log(`Administrator access granted to ${email}.`);
