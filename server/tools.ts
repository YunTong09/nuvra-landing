import type { Express } from "express";
import type Database from "better-sqlite3";

export function registerTools(app: Express, database: Database.Database) {
  // Seed only when the table is first created, never after an admin deletes tools.
  const tableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tools'",
    )
    .get();
  database.transaction(() => {
    database.exec(`CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`);
    if (!tableExists) {
      const insert = database.prepare(
        "INSERT INTO tools (title, description) VALUES (?, ?)",
      );
      const initialTools = [
        [
          "Task Simplifier",
          "Turn a long or overwhelming task into smaller, clearer steps.",
        ],
        [
          "Daily Priorities",
          "Choose what matters most today and keep important tasks visible.",
        ],
        [
          "Routine Builder",
          "Create simple repeatable routines without complicated setup.",
        ],
        [
          "Reminder Tool",
          "Keep track of important tasks and reminders in one clear place.",
        ],
      ];
      for (const [title, description] of initialTools)
        insert.run(title, description);
    }
  })();

  app.get("/api/tools", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(database.prepare("SELECT * FROM tools ORDER BY id").all());
  });

  app.post("/api/tools", (req, res) => {
    const { title, description } = req.body ?? {};
    const error = validateTool(title, description);
    if (error) return res.status(400).json({ error });
    const result = database
      .prepare("INSERT INTO tools (title, description) VALUES (?, ?)")
      .run(title.trim(), description.trim());
    res
      .status(201)
      .json(
        database
          .prepare("SELECT * FROM tools WHERE id = ?")
          .get(result.lastInsertRowid),
      );
  });

  app.put("/api/tools/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1)
      return res.status(400).json({ error: "Invalid tool ID." });
    const { title, description } = req.body ?? {};
    const error = validateTool(title, description);
    if (error) return res.status(400).json({ error });
    const result = database
      .prepare(
        `UPDATE tools SET title = ?, description = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      )
      .run(title.trim(), description.trim(), id);
    if (!result.changes)
      return res
        .status(404)
        .json({ error: "Tool not found. Refresh the list and try again." });
    res.json(database.prepare("SELECT * FROM tools WHERE id = ?").get(id));
  });

  app.delete("/api/tools/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1)
      return res.status(400).json({ error: "Invalid tool ID." });
    const result = database.prepare("DELETE FROM tools WHERE id = ?").run(id);
    if (!result.changes)
      return res
        .status(404)
        .json({ error: "Tool not found. Refresh the list and try again." });
    res.status(204).end();
  });
}

function validateTool(title: unknown, description: unknown) {
  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    !title.trim() ||
    !description.trim()
  ) {
    return "Title and description are required.";
  }
  if (title.trim().length > 100 || description.trim().length > 1000) {
    return "Keep the title under 101 characters and description under 1001 characters.";
  }
  return "";
}
