import assert from "node:assert/strict";
import test from "node:test";
import { originalApiUrl } from "../api/index.ts";

test("Vercel rewrite preserves API paths and query parameters", () => {
  assert.equal(originalApiUrl("/api/index?__route=tools"), "/api/tools");
  assert.equal(originalApiUrl("/api/index?__route=subscriptions/42&filter=active"),
    "/api/subscriptions/42?filter=active");
  assert.equal(originalApiUrl("/api/clients/7"), "/api/clients/7");
  assert.equal(originalApiUrl("/api/index"), null);
});
