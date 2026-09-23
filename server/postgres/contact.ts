import type { Express } from "express";
import type { Pool } from "pg";

export function registerPostgresContact(app: Express, db: Pool) {
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body ?? {};
    if ([name, email, subject, message].some(v => typeof v !== "string" || !v.trim()))
      return res.status(400).json({ error: "All fields are required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return res.status(400).json({ error: "Please provide a valid email address" });
    try {
      await db.query("INSERT INTO inquiries (name, email, subject, message) VALUES ($1, $2, $3, $4)",
        [name.trim(), email.trim(), subject.trim(), message.trim()]);
      return res.status(201).json({ message: "Inquiry received successfully" });
    } catch {
      return res.status(500).json({ error: "Could not save inquiry" });
    }
  });
}
