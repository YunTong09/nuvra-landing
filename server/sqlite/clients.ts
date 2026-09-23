import type { Express } from "express";
import type Database from "better-sqlite3";
import { validId } from "./validation.ts";

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

export function registerSqliteClients(app: Express, db: Database.Database) {
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
}
