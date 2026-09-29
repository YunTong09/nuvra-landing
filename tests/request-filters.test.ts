import test from "node:test";
import assert from "node:assert/strict";
import type { Pool } from "pg";
import { parseRequestFilters } from "../server/requests/filters.ts";
import { postgresRequests } from "../server/requests/postgres.ts";

test("request filters reject impossible dates and structured query values", () => {
  assert.deepEqual(parseRequestFilters({ q: "  hello  ", from: "2024-02-29" }), { q: "hello", from: "2024-02-29" });
  for (const query of [{ from: "2025-02-29" }, { status: ["pending"] }, { q: { text: "x" } }, { to: "0000-01-01" }]) {
    assert.throws(() => parseRequestFilters(query));
  }
});

test("PostgreSQL adapter binds combined filters and keeps ownership outside search alternatives", async () => {
  let statement = "";
  let parameters: unknown[] = [];
  const db = { async query(sql: string, values: unknown[]) {
    statement = sql; parameters = values;
    return { rows: [{ id: 42 }] };
  } } as unknown as Pool;
  const filters = parseRequestFilters({ q: "100%_!", status: "pending", from: "2026-09-20", to: "2026-09-20" });
  assert.deepEqual(await postgresRequests(db).list(7, filters), [{ id: 42 }]);
  assert.ok(statement.includes("WHERE customer_requests.user_id = $1 AND ("));
  assert.ok(!statement.includes("100%"));
  assert.deepEqual(parameters, [7, "%100!%!_!!%", "%100!%!_!!%", "%100!%!_!!%", "pending", "2026-09-20T00:00:00.000Z", "2026-09-21T00:00:00.000Z"]);
  assert.equal((statement.match(/\$\d+/g) || []).length, parameters.length);
  await postgresRequests(db).list(undefined, { q: "customer@example.com" });
  assert.ok(statement.includes("LOWER(users.email) LIKE"));
  assert.ok(!statement.includes("customer_requests.user_id ="));
});
