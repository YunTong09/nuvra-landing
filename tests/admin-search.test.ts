import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import Database from "better-sqlite3";
import { createApp } from "../server/app.ts";
import { tokenHash } from "../server/auth-core.ts";
import { searchWhere } from "../server/search.ts";

test("all admin sections search database records and preserve permissions", async () => {
  const db = new Database(":memory:");
  const app = createApp(db);
  const token = Buffer.alloc(32, 9).toString("base64url");
  db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (1, 'Admin', 'admin@example.com', 'unused', 'admin')").run();
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, 1, ?)").run(tokenHash(token), Date.now() + 60_000);
  db.prepare("INSERT INTO tools (title, description) VALUES ('Focus 100%', 'Daily planning')").run();
  db.prepare("INSERT INTO clients (name, email) VALUES ('Alice', 'alice@example.com'), ('Bob', 'bob@example.com')").run();
  db.prepare("INSERT INTO subscriptions (client_id, tool_id, status) VALUES (1, 5, 'active'), (2, 1, 'cancelled')").run();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const get = (path: string, authenticated = true) => fetch(`http://127.0.0.1:${address.port}/api/${path}`, {
    headers: authenticated ? { Cookie: `nuvra_session=${token}` } : {},
  });
  try {
    for (const [section, query, expected] of [
      ["tools", "FOCUS", 1], ["tools", "100%", 1], ["tools", "Daily planning", 1],
      ["clients", "ALICE", 1], ["clients", "bob@example.com", 1],
      ["subscriptions", "Alice", 1], ["subscriptions", "Focus", 1], ["subscriptions", "cancelled", 1],
    ] as const) {
      const response = await get(`${section}?q=${encodeURIComponent(query)}`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).length, expected);
    }
    for (const section of ["tools", "clients", "subscriptions"]) {
      assert.deepEqual(await (await get(`${section}?q=not-found`)).json(), []);
      assert.deepEqual(await (await get(`${section}?q=${encodeURIComponent("' OR 1=1 --")}`)).json(), []);
      assert.equal((await get(`${section}?q=a&q=b`)).status, 400);
      assert.equal((await get(`${section}?q=${"x".repeat(151)}`)).status, 400);
      assert.ok((await (await get(`${section}?q=`)).json()).length > 1);
    }
    assert.equal((await get("tools?q=Focus", false)).status, 200);
    assert.equal((await get("clients?q=Alice", false)).status, 401);
    assert.equal((await get("subscriptions?q=Alice", false)).status, 401);
    db.prepare("UPDATE users SET role = 'user' WHERE id = 1").run();
    assert.equal((await get("clients?q=Alice")).status, 403);
    assert.equal((await get("subscriptions?q=Alice")).status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
});

test("shared PostgreSQL search binds literal wildcard text", () => {
  const result = searchWhere("50%_!", ["title", "description"], "postgres");
  assert.deepEqual(result.values, ["%50!%!_!!%", "%50!%!_!!%"]);
  assert.ok(result.where.includes("$1") && result.where.includes("$2"));
  assert.ok(!result.where.includes("50%"));
});
