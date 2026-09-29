import type Database from "better-sqlite3";

// Rebuild the old CHECK constraint without deleting related sessions or requests.
export function migrateSqliteUserRoles(db: Database.Database) {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get() as { sql: string } | undefined;
  if (!table || table.sql.includes("'employee'")) return;
  const foreignKeys = db.pragma("foreign_keys", { simple: true });
  db.pragma("foreign_keys = OFF");
  try {
    db.transaction(() => {
      const sequence = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'users'")
        .get() as { seq: number } | undefined;
      const extras = db.prepare("SELECT sql FROM sqlite_master WHERE tbl_name = 'users' AND type IN ('index', 'trigger') AND sql IS NOT NULL")
        .all() as { sql: string }[];
      db.exec(`
        CREATE TABLE users_with_employee (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
          email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','employee','admin')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_with_employee SELECT id, name, email, password_hash, role, created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_with_employee RENAME TO users;
      `);
      if (sequence) db.prepare("UPDATE sqlite_sequence SET seq = MAX(seq, ?) WHERE name = 'users'").run(sequence.seq);
      for (const extra of extras) db.exec(extra.sql);
      const violations = db.pragma("foreign_key_check") as unknown[];
      if (violations.length) throw new Error("User role migration failed foreign key validation.");
    })();
  } finally {
    db.pragma(`foreign_keys = ${foreignKeys ? "ON" : "OFF"}`);
  }
}
