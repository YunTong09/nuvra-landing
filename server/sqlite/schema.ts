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
      status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
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
}
