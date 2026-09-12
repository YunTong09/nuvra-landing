import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import Database from "better-sqlite3";
import { createApp } from "../server/app.ts";

test("clients and subscriptions enforce relationships and preserve existing records", async () => {
  const db = new Database(":memory:");
  const server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/`;
  const request = (path: string, method = "GET", body?: object) =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
    assert.equal(
      (await request("clients", "POST", { name: "", email: "bad" })).status,
      400,
    );
    const response = await request("clients", "POST", {
      name: " Amy ",
      email: "AMY@example.com",
    });
    assert.equal(response.status, 201);
    const amy = await response.json();
    assert.equal(amy.name, "Amy");
    assert.equal(amy.email, "amy@example.com");
    assert.ok(amy.created_at && amy.updated_at);
    assert.equal(
      (
        await request("clients", "POST", {
          name: "Other",
          email: "amy@EXAMPLE.com",
        })
      ).status,
      409,
    );
    const ben = await (
      await request("clients", "POST", {
        name: "Ben",
        email: "ben@example.com",
      })
    ).json();
    const tools = await (await request("tools")).json();
    const input = { client_id: amy.id, tool_id: tools[0].id, status: "active" };
    assert.equal(
      (await request("subscriptions", "POST", { ...input, client_id: 9999 }))
        .status,
      409,
    );
    assert.equal(
      (await request("subscriptions", "POST", { ...input, tool_id: 9999 }))
        .status,
      409,
    );
    assert.equal(
      (
        await request("subscriptions", "POST", {
          ...input,
          client_id: String(amy.id),
        })
      ).status,
      400,
    );
    assert.equal(
      (await request("subscriptions", "POST", { ...input, status: "unknown" }))
        .status,
      400,
    );
    const subResponse = await request("subscriptions", "POST", input);
    assert.equal(subResponse.status, 201);
    const subscription = await subResponse.json();
    assert.equal(subscription.client_name, "Amy");
    assert.equal(subscription.tool_title, tools[0].title);
    assert.equal((await request("subscriptions", "POST", input)).status, 409);
    const sharedTool = await request("subscriptions", "POST", {
      ...input,
      client_id: ben.id,
    });
    assert.equal(sharedTool.status, 201);
    const sharedId = (await sharedTool.json()).id;
    const secondTool = await request("subscriptions", "POST", {
      ...input,
      tool_id: tools[1].id,
    });
    assert.equal(secondTool.status, 201);
    const secondId = (await secondTool.json()).id;
    assert.equal(
      (await request(`subscriptions/${secondId}`, "PUT", input)).status,
      409,
    );
    assert.equal((await request(`clients/${amy.id}`, "DELETE")).status, 409);
    assert.equal((await request(`tools/${tools[0].id}`, "DELETE")).status, 409);
    assert.equal(
      (
        await request(`clients/${amy.id}`, "PUT", {
          name: "Amy Updated",
          email: "ben@example.com",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request(`clients/${amy.id}`, "PUT", {
          name: "Amy Updated",
          email: "amy@example.com",
        })
      ).status,
      200,
    );
    let update = await request(`subscriptions/${subscription.id}`, "PUT", {
      ...input,
      status: "cancelled",
    });
    assert.equal(update.status, 200);
    let record = await update.json();
    assert.equal(record.status, "cancelled");
    assert.equal(record.client_name, "Amy Updated");
    assert.equal(record.created_at, subscription.created_at);
    assert.ok(record.updated_at >= subscription.updated_at);
    assert.equal((await request(`clients/${amy.id}`, "DELETE")).status, 409);
    update = await request(`subscriptions/${subscription.id}`, "PUT", input);
    record = await update.json();
    assert.equal(record.status, "active");
    createApp(db); // Startup is additive and must not wipe or duplicate saved records.
    assert.equal((await (await request("clients")).json()).length, 2);
    assert.equal((await (await request("subscriptions")).json()).length, 3);
    for (const id of [subscription.id, secondId, sharedId])
      assert.equal(
        (await request(`subscriptions/${id}`, "DELETE")).status,
        204,
      );
    assert.equal((await request(`clients/${amy.id}`, "DELETE")).status, 204);
    assert.equal((await request(`tools/${tools[0].id}`, "DELETE")).status, 204);
    assert.equal((await request("subscriptions/99999", "DELETE")).status, 404);
    assert.equal((await request("clients/not-an-id", "DELETE")).status, 400);
    assert.equal(
      (
        await request("clients/99999", "PUT", {
          name: "Missing",
          email: "missing@example.com",
        })
      ).status,
      404,
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    db.close();
  }
});
