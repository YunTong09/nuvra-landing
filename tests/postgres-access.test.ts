import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Pool } from "pg";
import { createPostgresApp } from "../server/postgres.ts";
import { tokenHash } from "../server/auth-core.ts";

test("PostgreSQL API enforces sessions and administrator access", async () => {
  const userToken = Buffer.alloc(32, 1).toString("base64url");
  const adminToken = Buffer.alloc(32, 2).toString("base64url");
  const employeeToken = Buffer.alloc(32, 3).toString("base64url");
  const requestQueries: { sql: string; values: unknown[] }[] = [];
  const db = {
    async query(sql: string, values: unknown[] = []) {
      if (sql.includes("FROM sessions JOIN users")) {
        const role = values[0] === tokenHash(adminToken) ? "admin" :
          values[0] === tokenHash(userToken) ? "user" :
          values[0] === tokenHash(employeeToken) ? "employee" : null;
        return { rows: role ? [{ id: 1, name: "Test", email: "test@example.com", role }] : [], rowCount: role ? 1 : 0 };
      }
      if (sql.startsWith("UPDATE users SET name"))
        return { rows: [{ id: 1, name: values[0], email: values[1], role: "user" }], rowCount: 1 };
      if (sql === "SELECT * FROM clients ORDER BY id" || sql === "SELECT * FROM tools ORDER BY id")
        return { rows: [], rowCount: 0 };
      if (sql.includes("FROM customer_requests") || sql.startsWith("UPDATE customer_requests")) {
        requestQueries.push({ sql, values });
        return { rows: [{ id: 1, user_id: 5, status: "completed" }], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  } as unknown as Pool;
  const server = createPostgresApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const request = (path: string, method = "GET", token?: string, body?: object) => fetch(base + path, {
    method, headers: { "Content-Type": "application/json", "X-Nuvra-Request": "1",
      ...(token ? { Cookie: `nuvra_session=${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try {
    assert.equal((await request("/api/requests")).status, 401);
    assert.equal((await request("/api/requests", "POST", undefined, { subject: "Help", message: "Help me" })).status, 401);
    assert.equal((await request("/api/requests/1/status", "PUT", userToken, { status: "completed" })).status, 403);
    assert.equal((await request("/api/requests/1/status", "PUT", adminToken, { status: "invalid" })).status, 400);
    assert.equal((await request("/api/tools")).status, 200);
    assert.equal((await request("/api/clients")).status, 401);
    assert.equal((await request("/api/clients", "GET", userToken)).status, 403);
    assert.equal((await request("/api/clients", "GET", adminToken)).status, 200);
    assert.equal((await request("/api/tools", "POST", userToken)).status, 403);
    assert.equal((await request("/api/auth/me", "PUT", undefined, {
      name: "Updated", email: "updated@example.com",
    })).status, 401);
    for (const table of ["clients", "subscriptions", "tools"]) {
      for (const method of ["GET", "POST", "PUT", "DELETE"]) {
        const path = method === "PUT" || method === "DELETE" ? `${table}/1` : table;
        assert.equal((await request(`/api/${path}`, method, employeeToken)).status,
          table === "tools" && method === "GET" ? 200 : 403);
      }
    }
    assert.equal((await request("/api/requests?q=help&status=pending", "GET", employeeToken)).status, 200);
    assert.ok(!requestQueries[0].sql.includes("customer_requests.user_id ="));
    assert.ok(requestQueries[0].sql.includes("LOWER(users.email)"));
    assert.ok(requestQueries[0].values.includes("pending"));
    assert.equal((await request("/api/requests/1", "GET", employeeToken)).status, 200);
    assert.deepEqual(requestQueries[1].values, [1]);
    assert.equal((await request("/api/requests/1/status", "PUT", employeeToken, { status: "completed" })).status, 200);
    assert.deepEqual(requestQueries[2].values, ["completed", 1]);
    const update = await request("/api/auth/me", "PUT", userToken, {
      name: "Updated", email: "UPDATED@example.com",
    });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).user.email, "updated@example.com");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
