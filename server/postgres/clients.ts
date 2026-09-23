import type { Express } from "express";
import type { Pool } from "pg";
import { validId, routeId } from "./validation.ts";

const clientError = (name: unknown, email: unknown) => {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100)
    return "Enter a client name of 1–100 characters.";
  if (typeof email !== "string" || email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim()))
    return "Enter a valid email address.";
  return "";
};
export function registerPostgresClients(app: Express, db: Pool) {
  app.get("/api/clients", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json((await db.query("SELECT * FROM clients ORDER BY id")).rows);
  });
  app.post("/api/clients", async (req, res) => {
    const { name, email } = req.body ?? {};
    const error = clientError(name, email);
    if (error) return res.status(400).json({ error });
    const result = await db.query("INSERT INTO clients (name, email) VALUES ($1, $2) RETURNING *",
      [name.trim(), email.trim().toLowerCase()]);
    res.status(201).json(result.rows[0]);
  });
  app.put("/api/clients/:id", async (req, res) => {
    const id = routeId(req.params.id);
    if (!validId(id)) return res.status(400).json({ error: "Invalid client ID." });
    const { name, email } = req.body ?? {};
    const error = clientError(name, email);
    if (error) return res.status(400).json({ error });
    const result = await db.query(`UPDATE clients SET name = $1, email = $2,
      updated_at = now() WHERE id = $3 RETURNING *`, [name.trim(), email.trim().toLowerCase(), id]);
    if (!result.rowCount) return res.status(404).json({ error: "Client not found." });
    res.json(result.rows[0]);
  });
  app.delete("/api/clients/:id", async (req, res) => {
    const id = routeId(req.params.id);
    if (!validId(id)) return res.status(400).json({ error: "Invalid client ID." });
    const result = await db.query("DELETE FROM clients WHERE id = $1", [id]);
    if (!result.rowCount) return res.status(404).json({ error: "Client not found." });
    res.status(204).end();
  });
}
