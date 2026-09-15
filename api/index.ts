import type { IncomingMessage, ServerResponse } from "node:http";
import { Pool } from "pg";
import { createPostgresApp, initializePostgres } from "../server/postgres.ts";

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, max: 2 }) : null;
const app = pool ? createPostgresApp(pool) : null;
let initialization: Promise<void> | undefined;

export function originalApiUrl(rawUrl: string) {
  const url = new URL(rawUrl, "http://localhost");
  const route = url.searchParams.get("__route") ??
    (url.pathname.startsWith("/api/") && url.pathname !== "/api/index"
      ? url.pathname.slice(5) : null);
  if (!route || route.startsWith("/") || route.includes("..")) return null;
  url.searchParams.delete("__route");
  return `/api/${route}${url.search}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!pool || !app) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database is not configured." }));
    return;
  }
  // The rewrite sends every /api/* request here with its original route.
  const routeUrl = originalApiUrl(req.url || "/");
  if (!routeUrl) {
    res.statusCode = 404;
    res.end();
    return;
  }
  req.url = routeUrl;
  try {
    initialization ??= initializePostgres(pool);
    await initialization;
  } catch (error) {
    initialization = undefined;
    console.error("PostgreSQL initialization failed", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database is temporarily unavailable." }));
    return;
  }
  await new Promise<void>(resolve => {
    res.once("finish", resolve);
    res.once("close", resolve);
    app(req, res);
  });
}
