import type { Express } from "express";
import type Database from "better-sqlite3";

export function registerRelationships(app: Express, db: Database.Database) {
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
  `);

  app.get("/api/clients", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(db.prepare("SELECT * FROM clients ORDER BY id").all());
  });
  app.post("/api/clients", (req, res) => {
    const { name, email } = req.body ?? {};
    const error = validateClient(name, email);
    if (error) return res.status(400).json({ error });
    const result = db
      .prepare("INSERT INTO clients (name, email) VALUES (?, ?)")
      .run(name.trim(), email.trim().toLowerCase());
    res
      .status(201)
      .json(
        db
          .prepare("SELECT * FROM clients WHERE id = ?")
          .get(result.lastInsertRowid),
      );
  });
  app.put("/api/clients/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!validId(id))
      return res.status(400).json({ error: "Invalid client ID." });
    const { name, email } = req.body ?? {};
    const error = validateClient(name, email);
    if (error) return res.status(400).json({ error });
    const result = db
      .prepare(
        `UPDATE clients SET name = ?, email = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      )
      .run(name.trim(), email.trim().toLowerCase(), id);
    if (!result.changes)
      return res.status(404).json({ error: "Client not found." });
    res.json(db.prepare("SELECT * FROM clients WHERE id = ?").get(id));
  });
  app.delete("/api/clients/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!validId(id))
      return res.status(400).json({ error: "Invalid client ID." });
    const result = db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    if (!result.changes)
      return res.status(404).json({ error: "Client not found." });
    res.status(204).end();
  });

  const subscriptionQuery = `SELECT subscriptions.*, clients.name AS client_name,
    clients.email AS client_email, tools.title AS tool_title
    FROM subscriptions JOIN clients ON clients.id = subscriptions.client_id
    JOIN tools ON tools.id = subscriptions.tool_id`;

  app.get("/api/subscriptions", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(
      db.prepare(subscriptionQuery + " ORDER BY subscriptions.id").all(),
    );
  });
  app.post("/api/subscriptions", (req, res) => {
    const { client_id, tool_id, status } = req.body ?? {};
    const error = validateSubscription(client_id, tool_id, status);
    if (error) return res.status(400).json({ error });
    const result = db
      .prepare(
        "INSERT INTO subscriptions (client_id, tool_id, status) VALUES (?, ?, ?)",
      )
      .run(client_id, tool_id, status);
    res
      .status(201)
      .json(
        db
          .prepare(subscriptionQuery + " WHERE subscriptions.id = ?")
          .get(result.lastInsertRowid),
      );
  });
  app.put("/api/subscriptions/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!validId(id))
      return res.status(400).json({ error: "Invalid subscription ID." });
    const { client_id, tool_id, status } = req.body ?? {};
    const error = validateSubscription(client_id, tool_id, status);
    if (error) return res.status(400).json({ error });
    const result = db
      .prepare(
        `UPDATE subscriptions SET client_id = ?, tool_id = ?, status = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      )
      .run(client_id, tool_id, status, id);
    if (!result.changes)
      return res.status(404).json({ error: "Subscription not found." });
    res.json(
      db.prepare(subscriptionQuery + " WHERE subscriptions.id = ?").get(id),
    );
  });
  app.delete("/api/subscriptions/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!validId(id))
      return res.status(400).json({ error: "Invalid subscription ID." });
    const result = db.prepare("DELETE FROM subscriptions WHERE id = ?").run(id);
    if (!result.changes)
      return res.status(404).json({ error: "Subscription not found." });
    res.status(204).end();
  });
}

function validId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function validateClient(name: unknown, email: unknown) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100)
    return "Enter a client name of 1–100 characters.";
  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim())
  )
    return "Enter a valid email address.";
  return "";
}
function validateSubscription(
  clientId: unknown,
  toolId: unknown,
  status: unknown,
) {
  if (!validId(clientId) || !validId(toolId))
    return "Choose an existing client and tool.";
  if (status !== "active" && status !== "cancelled")
    return "Status must be active or cancelled.";
  return "";
}
