import type { Express } from "express";
import type { Pool } from "pg";
import { validId, routeId } from "./validation.ts";

const subscriptionError = (clientId: unknown, toolId: unknown, status: unknown) => {
  if (!validId(clientId) || !validId(toolId)) return "Choose an existing client and tool.";
  if (status !== "active" && status !== "cancelled") return "Status must be active or cancelled.";
  return "";
};

const subscriptionSelect = `SELECT subscriptions.*, clients.name AS client_name,
  clients.email AS client_email, tools.title AS tool_title
  FROM subscriptions JOIN clients ON clients.id = subscriptions.client_id
  JOIN tools ON tools.id = subscriptions.tool_id`;

export function registerPostgresSubscriptions(app: Express, db: Pool) {
  app.get("/api/subscriptions", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json((await db.query(subscriptionSelect + " ORDER BY subscriptions.id")).rows);
  });
  app.post("/api/subscriptions", async (req, res) => {
    const { client_id, tool_id, status } = req.body ?? {};
    const error = subscriptionError(client_id, tool_id, status);
    if (error) return res.status(400).json({ error });
    const result = await db.query(`INSERT INTO subscriptions (client_id, tool_id, status)
      VALUES ($1, $2, $3) RETURNING id`, [client_id, tool_id, status]);
    const record = await db.query(subscriptionSelect + " WHERE subscriptions.id = $1", [result.rows[0].id]);
    res.status(201).json(record.rows[0]);
  });
  app.put("/api/subscriptions/:id", async (req, res) => {
    const id = routeId(req.params.id);
    if (!validId(id)) return res.status(400).json({ error: "Invalid subscription ID." });
    const { client_id, tool_id, status } = req.body ?? {};
    const error = subscriptionError(client_id, tool_id, status);
    if (error) return res.status(400).json({ error });
    const result = await db.query(`UPDATE subscriptions SET client_id = $1, tool_id = $2,
      status = $3, updated_at = now() WHERE id = $4 RETURNING id`, [client_id, tool_id, status, id]);
    if (!result.rowCount) return res.status(404).json({ error: "Subscription not found." });
    const record = await db.query(subscriptionSelect + " WHERE subscriptions.id = $1", [id]);
    res.json(record.rows[0]);
  });
  app.delete("/api/subscriptions/:id", async (req, res) => {
    const id = routeId(req.params.id);
    if (!validId(id)) return res.status(400).json({ error: "Invalid subscription ID." });
    const result = await db.query("DELETE FROM subscriptions WHERE id = $1", [id]);
    if (!result.rowCount) return res.status(404).json({ error: "Subscription not found." });
    res.status(204).end();
  });
}
