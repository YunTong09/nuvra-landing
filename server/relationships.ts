import type { Express } from "express";
import type Database from "better-sqlite3";
import { initializeRelationships } from "./sqlite/schema.js";
import { registerSqliteClients } from "./sqlite/clients.js";
import { registerSqliteSubscriptions } from "./sqlite/subscriptions.js";

export function registerRelationships(app: Express, db: Database.Database) {
  initializeRelationships(db);
  registerSqliteClients(app, db);
  registerSqliteSubscriptions(app, db);
}
