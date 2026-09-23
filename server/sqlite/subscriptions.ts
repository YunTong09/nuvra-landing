import type { Express } from "express";
import type Database from "better-sqlite3";
import { validId } from "./validation.ts";

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

export function registerSqliteSubscriptions(app: Express, db: Database.Database) {
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
