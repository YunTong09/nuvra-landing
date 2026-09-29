import test from "node:test";
import assert from "node:assert/strict";
import { readApiResponse } from "../src/lib/api-response.ts";

test("API responses report hosting failures without leaking parser errors", async () => {
  for (const body of ["A server error has occurred", "<html>Gateway timeout</html>", ""]) {
    await assert.rejects(readApiResponse(new Response(body, { status: 500 })),
      { message: "The server is temporarily unavailable (HTTP 500). Please try again later." });
  }
  await assert.rejects(readApiResponse(new Response("Not found", { status: 404 })),
    { message: "Request failed (HTTP 404). Please try again." });
  await assert.rejects(readApiResponse(new Response("<html>Website</html>")),
    { message: "The server returned an unexpected response. Please try again." });
});

test("API responses preserve JSON errors, valid data, and empty logout responses", async () => {
  await assert.rejects(readApiResponse(Response.json({ error: "Invalid email or password." }, { status: 401 })),
    { message: "Invalid email or password." });
  await assert.rejects(readApiResponse(Response.json(null, { status: 503 })), /HTTP 503/);
  await assert.rejects(readApiResponse(Response.json({ error: { private: "detail" } }, { status: 500 })), /HTTP 500/);
  assert.deepEqual(await readApiResponse(Response.json({ user: { id: 1 } })), { user: { id: 1 } });
  assert.equal(await readApiResponse(new Response(null, { status: 204 })), null);
});
