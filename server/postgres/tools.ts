import type { Express } from "express";
import type { Pool } from "pg";
import { validId, routeId } from "./validation.ts";

const toolError = (title: unknown, description: unknown) => {
  if (typeof title !== "string" || typeof description !== "string" || !title.trim() || !description.trim())
    return "Title and description are required.";
  if (title.trim().length > 100 || description.trim().length > 1000)
    return "Keep the title under 101 characters and description under 1001 characters.";
  return "";
};
export function registerPostgresTools(app: Express, db: Pool) {
  app.get("/api/tools", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json((await db.query("SELECT * FROM tools ORDER BY id")).rows);
  });
  app.post("/api/tools", async (req, res) => {
    const { title, description } = req.body ?? {};
    const error = toolError(title, description);
    if (error) return res.status(400).json({ error });
    const result = await db.query("INSERT INTO tools (title, description) VALUES ($1, $2) RETURNING *",
      [title.trim(), description.trim()]);
    res.status(201).json(result.rows[0]);
  });
  app.put("/api/tools/:id", async (req, res) => {
    const id = routeId(req.params.id);
    if (!validId(id)) return res.status(400).json({ error: "Invalid tool ID." });
    const { title, description } = req.body ?? {};
    const error = toolError(title, description);
    if (error) return res.status(400).json({ error });
    const result = await db.query(`UPDATE tools SET title = $1, description = $2,
      updated_at = now() WHERE id = $3 RETURNING *`, [title.trim(), description.trim(), id]);
    if (!result.rowCount) return res.status(404).json({ error: "Tool not found. Refresh the list and try again." });
    res.json(result.rows[0]);
  });
  app.delete("/api/tools/:id", async (req, res) => {
    const id = routeId(req.params.id);
    if (!validId(id)) return res.status(400).json({ error: "Invalid tool ID." });
    const result = await db.query("DELETE FROM tools WHERE id = $1", [id]);
    if (!result.rowCount) return res.status(404).json({ error: "Tool not found. Refresh the list and try again." });
    res.status(204).end();
  });
}
