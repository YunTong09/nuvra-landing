import express from "express";
import type { Pool } from "pg";
import { registerPostgresAuth } from "./auth-postgres.js";
import { registerRequests } from "./requests/routes.js";
import { postgresRequests } from "./requests/postgres.js";
import { registerPostgresContact } from "./postgres/contact.js";
import { registerPostgresTools } from "./postgres/tools.js";
import { registerPostgresClients } from "./postgres/clients.js";
import { registerPostgresSubscriptions } from "./postgres/subscriptions.js";
import { handlePostgresError } from "./postgres/errors.js";
import { registerDocuments } from "./documents.js";
import { postgresDocuments } from "./postgres/documents.js";
import { blobDocumentStorage, registerDocumentBlobCallback } from "./document-storage.js";

// Keep the existing import path for server startup, migration, and Vercel.
export { initializePostgres } from "./postgres/schema.js";

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
  const documents = postgresDocuments(db);
  registerDocumentBlobCallback(app, documents);
  registerPostgresAuth(app, db);
  registerDocuments(app, documents, blobDocumentStorage());
  registerRequests(app, postgresRequests(db));
  app.get("/", (_req, res) => res.send("Nuvra backend is running"));

  registerPostgresContact(app, db);
  registerPostgresTools(app, db);
  registerPostgresClients(app, db);
  registerPostgresSubscriptions(app, db);
  app.use(handlePostgresError);
  return app;
}
