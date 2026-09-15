import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import Database from "better-sqlite3";
import { createApp } from "../server/app.ts";

test("registration, login, sessions, and admin access", async () => {
  const db = new Database(":memory:");
  const server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const request = (path: string, method = "GET", body?: object, cookie = "", headers = {}) =>
    fetch(base + path, { method, headers: {
      "Content-Type": "application/json", "X-Nuvra-Request": "1", ...(cookie ? { Cookie: cookie } : {}), ...headers,
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await request("/api/auth/me")).status, 401);
    assert.equal((await request("/api/auth/register", "POST", {
      name: "", email: "bad", password: "short",
    })).status, 400);
    assert.equal((await request("/api/auth/register", "POST", {
      name: "", email: "bad", password: "short",
    }, "", { Origin: "http://localhost:5173" })).status, 400);
    assert.equal((await request("/api/auth/register", "POST", {
      name: "Amy", email: "amy@example.com", password: "a secure phrase 123",
    }, "", { "Sec-Fetch-Site": "cross-site" })).status, 403);
    assert.equal((await request("/api/auth/register", "POST", {
      name: "Amy", email: "amy@example.com", password: "a secure phrase 123",
    }, "", { Origin: "https://unrelated.example" })).status, 403);
    const registration = await request("/api/auth/register", "POST", {
      name: " Amy ", email: "AMY@example.com", password: "a secure phrase 123",
    });
    assert.equal(registration.status, 201);
    const amyCookie = registration.headers.get("set-cookie")!.split(";")[0];
    assert.match(registration.headers.get("set-cookie")!, /HttpOnly/);
    assert.match(registration.headers.get("set-cookie")!, /SameSite=Strict/);
    const amy = (await registration.json()).user;
    assert.equal(amy.email, "amy@example.com");
    assert.equal(amy.role, "user");
    const stored = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(amy.id) as { password_hash: string };
    assert.ok(stored.password_hash.startsWith("scrypt$"));
    assert.ok(!stored.password_hash.includes("a secure phrase 123"));
    assert.equal((await request("/api/auth/register", "POST", {
      name: "Other", email: "amy@EXAMPLE.com", password: "another secure phrase",
    })).status, 409);
    assert.equal((await request("/api/clients", "GET", undefined, amyCookie)).status, 403);
    assert.equal((await request("/api/auth/me", "GET", undefined, amyCookie)).status, 200);
    assert.equal((await request("/api/auth/login", "POST", {
      email: "amy@example.com", password: "wrong password",
    })).status, 401);
    for (let attempt = 0; attempt < 5; attempt++)
      assert.equal((await request("/api/auth/login", "POST", {
        email: "missing@example.com", password: "wrong password",
      })).status, 401);
    assert.equal((await request("/api/auth/login", "POST", {
      email: "missing@example.com", password: "wrong password",
    })).status, 429);
    const login = await request("/api/auth/login", "POST", {
      email: "amy@example.com", password: "a secure phrase 123",
    });
    assert.equal(login.status, 200);
    const secondCookie = login.headers.get("set-cookie")!.split(";")[0];
    const account = await (await request("/api/auth/me", "GET", undefined, secondCookie)).json();
    assert.equal(account.user.email, "amy@example.com");
    const ben = await request("/api/auth/register", "POST", {
      name: "Ben", email: "ben@example.com", password: "ben secure phrase 123",
    });
    const benCookie = ben.headers.get("set-cookie")!.split(";")[0];
    const benAccount = await (await request("/api/auth/me", "GET", undefined, benCookie)).json();
    assert.equal(benAccount.user.email, "ben@example.com");
    assert.equal((await request("/api/auth/logout", "POST", undefined, amyCookie)).status, 204);
    assert.equal((await request("/api/auth/me", "GET", undefined, amyCookie)).status, 401);
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(amy.id);
    assert.equal((await request("/api/clients", "GET", undefined, secondCookie)).status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
});
