import express from "express";
import type { Pool } from "pg";
import { registerPostgresAuth } from "./auth-postgres.ts";
import { registerRequests } from "./requests/routes.ts";
import { postgresRequests } from "./requests/postgres.ts";
import { registerPostgresContact } from "./postgres/contact.ts";
import { registerPostgresTools } from "./postgres/tools.ts";
import { registerPostgresClients } from "./postgres/clients.ts";
import { registerPostgresSubscriptions } from "./postgres/subscriptions.ts";
import { handlePostgresError } from "./postgres/errors.ts";

// Keep the existing import path for server startup, migration, and Vercel.
export { initializePostgres } from "./postgres/schema.ts";

export function createPostgresApp(db: Pool) {
  const app = express();
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json());
  registerPostgresAuth(app, db);
  registerRequests(app, postgresRequests(db));
  app.get("/", (_req, res) => res.send("Nuvra backend is running"));

  registerPostgresContact(app, db);
  registerPostgresTools(app, db);
  registerPostgresClients(app, db);
  registerPostgresSubscriptions(app, db);
  app.use(handlePostgresError);
  return app;
}
