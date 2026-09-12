import express, { type ErrorRequestHandler } from "express";
import type Database from "better-sqlite3";
import { registerRelationships } from "./relationships.ts";
import { registerTools } from "./tools.ts";

export function createApp(database: Database.Database) {
  const app = express();
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Nuvra backend is running");
  });

  app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    try {
      const insertInquiry = database.prepare(`
            INSERT INTO inquiries (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `);

      insertInquiry.run(
        name.trim(),
        email.trim(),
        subject.trim(),
        message.trim(),
      );

      return res.status(201).json({
        message: "Inquiry received successfully",
      });
    } catch {
      return res.status(500).json({
        error: "Could not save inquiry",
      });
    }
  });

  registerTools(app, database);
  registerRelationships(app, database);
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : "";
    if (code === "SQLITE_CONSTRAINT_UNIQUE") {
      res
        .status(409)
        .json({
          error:
            "That email or client–tool subscription already exists. Edit the existing record instead.",
        });
      return;
    }
    if (
      code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
      (code === "SQLITE_CONSTRAINT_TRIGGER" &&
        error.message === "FOREIGN KEY constraint failed")
    ) {
      res
        .status(409)
        .json({
          error:
            "This record is linked to another table. Choose an existing client/tool, or remove its subscriptions before deleting it.",
        });
      return;
    }
    const malformed = error instanceof SyntaxError;
    res.status(malformed ? 400 : 500).json({
      error: malformed
        ? "Send valid JSON."
        : "Something went wrong. Please try again.",
    });
  };
  app.use(handleError);
  return app;
}
