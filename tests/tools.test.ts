import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import Database from "better-sqlite3";
import { createApp } from "../server/app.ts";

// Use an isolated database, never the user's inquiries or tools.
test("tools CRUD, validation, persistence, and feedback regression", async () => {
  const directory = mkdtempSync(join(tmpdir(), "nuvra-tools-"));
  const filename = join(directory, "test.db");
  const db = new Database(filename);
  const server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  async function request(path: string, method = "GET", body?: unknown) {
    return fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  try {
    const starters = await (await request("/api/tools")).json();
    assert.equal(starters.length, 4);
    assert.equal(starters[0].title, "Task Simplifier");
    for (const body of [
      {},
      { title: " ", description: "test" },
      { title: 12, description: "test" },
      { title: "x".repeat(101), description: "test" },
    ]) {
      assert.equal((await request("/api/tools", "POST", body)).status, 400);
    }
    const createdResponse = await request("/api/tools", "POST", {
      title: "  Focus list  ",
      description: "A small list.",
    });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();
    assert.equal(created.title, "Focus list");
    assert.ok(created.created_at && created.updated_at);
    assert.equal(
      (
        await request(`/api/tools/${created.id}`, "PUT", {
          title: "",
          description: "",
        })
      ).status,
      400,
    );
    const editedResponse = await request(`/api/tools/${created.id}`, "PUT", {
      title: "Focus today",
      description: "Choose one next step.",
    });
    assert.equal(editedResponse.status, 200);
    const edited = await editedResponse.json();
    assert.equal(edited.title, "Focus today");
    assert.equal(edited.created_at, created.created_at);
    assert.ok(edited.updated_at >= created.updated_at);
    assert.ok(
      (await (await request("/api/tools")).json()).some(
        (tool: { title: string }) => tool.title === "Focus today",
      ),
    );
    const reopened = new Database(filename);
    assert.equal(
      (
        reopened
          .prepare("SELECT title FROM tools WHERE id = ?")
          .get(created.id) as { title: string }
      ).title,
      "Focus today",
    );
    reopened.close();
    assert.equal((await request("/api/tools/not-an-id", "DELETE")).status, 400);
    assert.equal((await request("/api/tools/999999", "DELETE")).status, 404);
    assert.equal(
      (
        await request("/api/tools/999999", "PUT", {
          title: "Missing",
          description: "No record",
        })
      ).status,
      404,
    );
    assert.equal(
      (await request(`/api/tools/${created.id}`, "DELETE")).status,
      204,
    );
    assert.equal(
      (await request(`/api/tools/${created.id}`, "DELETE")).status,
      404,
    );
    const preflight = await request("/api/tools/1", "OPTIONS");
    assert.ok(
      preflight.headers.get("Access-Control-Allow-Methods")?.includes("DELETE"),
    );
    const feedback = {
      name: "Test",
      email: "test@example.com",
      subject: "Too many tasks",
      message: "Help me organise.",
    };
    assert.equal((await request("/api/contact", "POST", feedback)).status, 201);
    assert.equal(
      (await request("/api/contact", "POST", { ...feedback, email: "invalid" }))
        .status,
      400,
    );
    assert.equal(
      (
        db.prepare("SELECT COUNT(*) AS count FROM inquiries").get() as {
          count: number;
        }
      ).count,
      1,
    );
    const malformed = await fetch(base + "/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    // Deleting every tool must not cause starter records to reappear on restart.
    for (const tool of starters)
      assert.equal(
        (await request(`/api/tools/${tool.id}`, "DELETE")).status,
        204,
      );
    createApp(db);
    assert.equal((await (await request("/api/tools")).json()).length, 0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    db.close();
    rmSync(directory, { recursive: true });
  }
});
