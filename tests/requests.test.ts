import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createApp } from "../server/app.ts";
import { tokenHash } from "../server/auth-core.ts";

test("customer requests: submission, ownership, admin status updates, and persistence", async () => {
  const directory = mkdtempSync(join(tmpdir(), "nuvra-requests-"));
  const filename = join(directory, "requests.db");
  const db = new Database(filename);
  const app = createApp(db);
  const tokens = [1, 2, 3].map(value => Buffer.alloc(32, value).toString("base64url"));
  tokens.forEach((token, index) => {
    db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)")
      .run(index + 1, `Person ${index}`, `person${index}@example.com`, "unused", index === 2 ? "admin" : "user");
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
      .run(tokenHash(token), index + 1, Date.now() + 60_000);
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const request = (path: string, token?: string, method = "GET", body?: unknown) =>
    fetch(`http://127.0.0.1:${address.port}/api/requests${path}`, {
      method,
      headers: { "Content-Type": "application/json", "X-Nuvra-Request": "1",
        ...(token ? { Cookie: `nuvra_session=${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  try {
    assert.equal((await request("")).status, 401);
    assert.equal((await request("", undefined, "POST", { subject: "Hello", message: "Help" })).status, 401);
    for (const body of [{}, { subject: " ", message: "Help" }, { subject: "Help", message: 123 },
      { subject: "x".repeat(151), message: "Help" }, { subject: "Help", message: "x".repeat(5001) }]) {
      assert.equal((await request("", tokens[0], "POST", body)).status, 400);
    }
    const response = await request("", tokens[0], "POST", {
      subject: "  Routine help  ", message: "Help me build a routine.\nThank you!", user_id: 2, status: "completed",
    });
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.subject, "Routine help");
    assert.equal(created.user_id, 1);
    assert.equal(created.status, "pending");
    assert.ok(created.created_at && created.updated_at);
    assert.equal((await (await request("", tokens[0])).json()).length, 1);
    assert.deepEqual(await (await request("", tokens[1])).json(), []);
    assert.equal((await request(`/${created.id}`, tokens[1])).status, 404);
    assert.equal((await request(`/${created.id}`, tokens[0])).status, 200);
    assert.equal((await request("/invalid", tokens[0])).status, 400);
    assert.equal((await request("/9999", tokens[2])).status, 404);
    assert.equal((await request(`/${created.id}/status`, tokens[0], "PUT", { status: "completed" })).status, 403);
    assert.equal((await request(`/${created.id}/status`, tokens[1], "PUT", { status: "completed" })).status, 403);
    assert.equal((await request(`/${created.id}/status`, tokens[2], "PUT", { status: "invalid" })).status, 400);
    assert.equal((await request("/9999/status", tokens[2], "PUT", { status: "completed" })).status, 404);
    for (const status of ["in_progress", "completed", "cancelled", "pending"]) {
      const update = await request(`/${created.id}/status`, tokens[2], "PUT", { status });
      assert.equal(update.status, 200);
      const record = await update.json();
      assert.equal(record.status, status);
      assert.equal(record.created_at, created.created_at);
      assert.equal(record.message, created.message);
      assert.ok(record.updated_at >= created.updated_at);
      assert.equal((await (await request(`/${created.id}`, tokens[0])).json()).status, status);
    }
    const adminList = await (await request("", tokens[2])).json();
    assert.equal(adminList[0].customer_email, "person0@example.com");
    const crossOrigin = await fetch(`http://127.0.0.1:${address.port}/api/requests/${created.id}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json", Origin: "https://unrelated.example",
        "X-Nuvra-Request": "1", Cookie: `nuvra_session=${tokens[2]}` }, body: JSON.stringify({ status: "completed" }),
    });
    assert.equal(crossOrigin.status, 403);
    // Combined backend search and filtering with ownership and UTC boundaries.
    db.prepare("UPDATE customer_requests SET created_at = ? WHERE id = ?")
      .run("2026-09-20T23:59:59.999Z", created.id);
    const insert = db.prepare("INSERT INTO customer_requests (user_id, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?)");
    const completedId = Number(insert.run(1, "ROUTINE complete", "100% done_under budget!", "completed", "2026-09-21T00:00:00.000Z").lastInsertRowid);
    insert.run(2, "Routine private", "Someone else's request", "pending", "2026-09-20T12:00:00.000Z");
    const results = async (query: string, token = tokens[0]) => {
      const response = await request(query, token);
      assert.equal(response.status, 200);
      return response.json();
    };
    assert.equal((await results("?q=ROUTINE")).length, 2);
    assert.equal((await results("?q=ROUTINE", tokens[2])).length, 3);
    assert.deepEqual((await results("?q=routine&status=pending&from=2026-09-20&to=2026-09-20")).map((r: { id: number }) => r.id), [created.id]);
    assert.equal((await results("?q=routine&status=completed&from=2026-09-20&to=2026-09-20")).length, 0);
    assert.equal((await results("?from=2026-09-21&to=2026-09-21"))[0].id, completedId);
    assert.equal((await results("?q=person1%40example.com", tokens[2])).length, 1);
    assert.equal((await results("?q=person1%40example.com")).length, 0);
    for (const text of ["100%", "done_under", "budget!"]) {
      assert.equal((await results(`?q=${encodeURIComponent(text)}`))[0].id, completedId);
    }
    assert.equal((await results("?q=" + encodeURIComponent("' OR 1=1 --"))).length, 0);
    assert.equal((await results("?status=pending&user_id=2")).length, 1);
    assert.equal((await results("?q=does-not-exist")).length, 0);
    for (const query of ["?status=bad", "?from=2026-02-30", "?from=2026-09-22&to=2026-09-20", "?q=a&q=b", "?to=wrong", "?q=" + "x".repeat(151)]) {
      assert.equal((await request(query, tokens[0])).status, 400);
    }
    assert.equal((await request("?q=routine")).status, 401);
    await request(`/${created.id}/status`, tokens[2], "PUT", { status: "completed" });
    assert.equal((await results("?status=pending")).length, 0);
    assert.equal((await results("?status=completed")).length, 2);
    db.prepare("DELETE FROM customer_requests WHERE id != ?").run(created.id);
    const reopened = new Database(filename);
    createApp(reopened);
    assert.equal((reopened.prepare("SELECT COUNT(*) AS count FROM customer_requests").get() as { count: number }).count, 1);
    reopened.close();
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
    rmSync(directory, { recursive: true });
  }
});
