import type { Express } from "express";
import type Database from "better-sqlite3";
import { initializeRelationships } from "./sqlite/schema.ts";
import { registerSqliteClients } from "./sqlite/clients.ts";
import { registerSqliteSubscriptions } from "./sqlite/subscriptions.ts";

export function registerRelationships(app: Express, db: Database.Database) {
  initializeRelationships(db);
  registerSqliteClients(app, db);
  registerSqliteSubscriptions(app, db);
}
