import Database from "better-sqlite3";
import { createApp } from "./app.ts";
import { Pool } from "pg";
import { createPostgresApp, initializePostgres } from "./postgres.ts";

const port = process.env.PORT || 3001;
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await initializePostgres(pool);
    createPostgresApp(pool).listen(port, () => console.log(`Backend running on port ${port} (PostgreSQL)`));
  } catch (error) {
    console.error("PostgreSQL initialization failed", error);
    await pool.end();
    process.exitCode = 1;
  }
} else {
  const database = new Database(process.env.DATABASE_PATH || "server/voltix.db");
  createApp(database).listen(port, () => console.log(`Backend running on port ${port} (SQLite)`));
}
