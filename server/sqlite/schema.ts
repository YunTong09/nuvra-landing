import type Database from "better-sqlite3";

export function initializeRelationships(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      UNIQUE(client_id, tool_id)
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_tool ON subscriptions(tool_id);
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL CHECK (typeof(file_size) = 'integer' AND file_size BETWEEN 0 AND 9007199254740991),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not Started'
        CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      PRIMARY KEY (project_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
  `);
  migrateProjectStatuses(db);
}

function migrateProjectStatuses(db: Database.Database) {
  db.transaction(() => {
    const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'projects'")
      .get() as { sql: string };
    if (!table.sql.includes("'not_started'")) return;

    // SQLite cannot replace CHECK constraints in place. Preserve both the member
    // relationships and the AUTOINCREMENT high-water mark while rebuilding.
    const sequence = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'projects'")
      .get() as { seq: number } | undefined;
    db.exec(`
      CREATE TABLE projects_status_migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Not Started'
          CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      INSERT INTO projects_status_migration
        (id, client_id, name, description, status, created_at, updated_at)
      SELECT id, client_id, name, description,
        CASE status
          WHEN 'not_started' THEN 'Not Started'
          WHEN 'in_progress' THEN 'In Progress'
          WHEN 'completed' THEN 'Completed'
          WHEN 'on_hold' THEN 'On Hold'
          ELSE status
        END, created_at, updated_at FROM projects;
      CREATE TEMP TABLE project_members_status_backup AS SELECT * FROM project_members;
      DROP TABLE project_members;
      DROP TABLE projects;
      ALTER TABLE projects_status_migration RENAME TO projects;
      CREATE INDEX idx_projects_client ON projects(client_id);
      CREATE TABLE project_members (
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        PRIMARY KEY (project_id, user_id)
      );
      INSERT INTO project_members SELECT project_id, user_id FROM project_members_status_backup;
      DROP TABLE project_members_status_backup;
      CREATE INDEX idx_project_members_user ON project_members(user_id);
    `);
    if (sequence) {
      db.prepare("UPDATE sqlite_sequence SET seq = max(seq, ?) WHERE name = 'projects'").run(sequence.seq);
    }
    if ((db.pragma("foreign_key_check(projects)") as unknown[]).length || (db.pragma("foreign_key_check(project_members)") as unknown[]).length)
      throw new Error("Project status migration failed relationship validation.");
  }).immediate();
}
