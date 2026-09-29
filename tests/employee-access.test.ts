import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import Database from "better-sqlite3";
import { createApp } from "../server/app.ts";
import { tokenHash } from "../server/auth-core.ts";
import { migrateSqliteUserRoles } from "../server/sqlite/user-roles.ts";

test("employees manage requests but cannot manage company records or grant themselves roles", async () => {
  const db = new Database(":memory:");
  const app = createApp(db);
  const tokens = [11, 12, 13].map(value => Buffer.alloc(32, value).toString("base64url"));
  ["user", "employee", "admin"].forEach((role, i) => {
    db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, 'unused', ?)")
      .run(i + 1, role, `${role}@example.com`, role);
    db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(tokenHash(tokens[i]), i + 1, Date.now() + 60_000);
  });
  db.prepare("INSERT INTO customer_requests (user_id, subject, message) VALUES (1, 'Need help', 'Details')").run();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const request = (path: string, token = tokens[1], method = "GET", body?: object) =>
    fetch(`http://127.0.0.1:${address.port}/api/${path}`, {
      method, headers: { "Content-Type": "application/json", "X-Nuvra-Request": "1", Cookie: `nuvra_session=${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    const list = await request("requests?q=user%40example.com&status=pending");
    assert.equal(list.status, 200);
    assert.equal((await list.json()).length, 1);
    assert.equal((await request("requests/1")).status, 200);
    assert.equal((await request("requests/1/status", tokens[1], "PUT", { status: "completed", user_id: 2, message: "Replaced" })).status, 200);
    const record = await (await request("requests/1", tokens[0])).json();
    assert.equal(record.status, "completed");
    assert.equal(record.message, "Details");
    assert.equal(record.user_id, 1);
    assert.equal((await request("requests/1/status", tokens[0], "PUT", { status: "pending" })).status, 403);
    assert.equal((await request("requests/1/status", tokens[1], "PUT", { status: "invalid" })).status, 400);
    for (const table of ["clients", "subscriptions", "tools"]) {
      for (const method of ["GET", "POST", "PUT", "DELETE"]) {
        const path = method === "PUT" || method === "DELETE" ? `${table}/1` : table;
        assert.equal((await request(path, tokens[1], method)).status,
          table === "tools" && method === "GET" ? 200 : 403, `${method} ${path}`);
      }
    }
    const profile = await request("auth/me", tokens[1], "PUT", {
      name: "Employee Updated", email: "employee@example.com", role: "admin",
    });
    assert.equal(profile.status, 200);
    assert.equal((await profile.json()).user.role, "employee");
    const registration = await request("auth/register", "", "POST", {
      name: "New customer", email: "new@example.com", password: "a secure phrase 123", role: "employee",
    });
    assert.equal(registration.status, 201);
    assert.equal((await registration.json()).user.role, "user");
    // Existing sessions must immediately obey a role change in the database.
    db.prepare("UPDATE users SET role = 'user' WHERE id = 2").run();
    assert.equal((await request("requests/1/status", tokens[1], "PUT", { status: "pending" })).status, 403);
    assert.equal((await request("requests/1")).status, 404);
    assert.equal((await request("requests/1/status", tokens[2], "PUT", { status: "pending" })).status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
});

test("SQLite role migration preserves users, sessions, requests and ID sequence", () => {
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys = ON");
    db.exec(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO users (id, name, email, password_hash) VALUES (1, 'Customer', 'customer@example.com', 'hash');
    INSERT INTO users (id, name, email, password_hash) VALUES (99, 'Deleted', 'deleted@example.com', 'hash');
    DELETE FROM users WHERE id = 99;
    CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER);
    INSERT INTO sessions VALUES ('session', 1, 123);
    CREATE TABLE customer_requests (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT);
    INSERT INTO customer_requests VALUES (1, 1);`);
    const before = db.prepare("SELECT * FROM users").all();
    migrateSqliteUserRoles(db);
    migrateSqliteUserRoles(db);
    assert.deepEqual(db.prepare("SELECT * FROM users").all(), before);
    assert.equal(db.prepare("SELECT * FROM sessions").all().length, 1);
    assert.equal(db.prepare("SELECT * FROM customer_requests").all().length, 1);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
    assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
    assert.equal(db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('Employee', 'employee@example.com', 'hash', 'employee')").run().lastInsertRowid, 100);
    assert.throws(() => db.prepare("UPDATE users SET role = 'superuser' WHERE id = 1").run());
  } finally { db.close(); }
});
