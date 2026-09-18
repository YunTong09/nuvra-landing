import type { Express, Response } from "express";
import type Database from "better-sqlite3";
import {
  clearSessionCookie, clientKey, dummyPasswordHash, hashPassword, newSession, normalizedEmail,
  profileError, registrationError, sameOriginMutation, sessionDurationMs, sessionToken,
  setSessionCookie, tokenHash, verifyPassword,
} from "./auth-core.ts";

type User = { id: number; name: string; email: string; role: "user" | "admin" };

export function registerSqliteAuth(app: Express, db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_attempts (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, window_start INTEGER NOT NULL
    );
  `);

  function attempts(key: string) {
    const now = Date.now();
    const attempt = db.prepare("SELECT attempts, window_start FROM auth_attempts WHERE key = ?")
      .get(key) as { attempts: number; window_start: number } | undefined;
    if (!attempt || attempt.window_start < now - 15 * 60_000) {
      db.prepare("INSERT INTO auth_attempts (key, attempts, window_start) VALUES (?, 0, ?) ON CONFLICT(key) DO UPDATE SET attempts = 0, window_start = excluded.window_start")
        .run(key, now);
      return 0;
    }
    return attempt.attempts;
  }
  function increment(key: string) {
    db.prepare("UPDATE auth_attempts SET attempts = attempts + 1 WHERE key = ?").run(key);
  }

  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const path = req.baseUrl + req.path;
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (mutation && path !== "/api/contact" && !sameOriginMutation(req))
      return res.status(403).json({ error: "Request could not be verified." });
    if (path === "/api/contact" ||
        (req.method === "GET" && path === "/api/tools") ||
        path === "/api/auth/register" || path === "/api/auth/login") return next();
    const token = sessionToken(req);
    if (!token) return res.status(401).json({ error: "Please log in." });
    const user = db.prepare(`SELECT users.id, users.name, users.email, users.role
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?`)
      .get(tokenHash(token), Date.now()) as User | undefined;
    if (!user) return res.status(401).json({ error: "Please log in." });
    res.locals.user = user;
    const adminPath = path.startsWith("/api/clients") ||
      path.startsWith("/api/subscriptions") ||
      (path.startsWith("/api/tools") && req.method !== "GET");
    if (adminPath && user.role !== "admin")
      return res.status(403).json({ error: "Administrator access required." });
    next();
  });

  function issueSession(user: User, res: Response) {
    const { token, hash } = newSession();
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
      .run(hash, user.id, Date.now() + sessionDurationMs);
    setSessionCookie(res, token);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body ?? {};
    const error = registrationError(name, email, password);
    if (error) return res.status(400).json({ error });
    const registrationKey = `register:${clientKey(req)}`;
    if (attempts(registrationKey) >= 10)
      return res.status(429).json({ error: "Too many registrations. Try again later." });
    const existing = db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalizedEmail(email));
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    increment(registrationKey);
    const passwordHash = await hashPassword(password);
    try {
      const result = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
        .run(name.trim(), normalizedEmail(email), passwordHash);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?")
        .get(result.lastInsertRowid) as User;
      res.status(201).json({ user: issueSession(user, res) });
    } catch (failure) {
      if ((failure as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE")
        return res.status(409).json({ error: "An account with this email already exists." });
      throw failure;
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || email.length > 254 || typeof password !== "string" || password.length > 128)
      return res.status(400).json({ error: "Enter your email and password." });
    const key = `login:${normalizedEmail(email)}`;
    const ipKey = `login-ip:${clientKey(req)}`;
    if (attempts(key) >= 5 || attempts(ipKey) >= 20)
      return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    const user = db.prepare("SELECT id, name, email, role, password_hash FROM users WHERE email = ?")
      .get(normalizedEmail(email)) as (User & { password_hash: string }) | undefined;
    const verified = await verifyPassword(password, user?.password_hash ?? dummyPasswordHash);
    if (!user || !verified) {
      increment(key);
      increment(ipKey);
      return res.status(401).json({ error: "Invalid email or password." });
    }
    db.prepare("DELETE FROM auth_attempts WHERE key = ?").run(key);
    res.json({ user: issueSession(user, res) });
  });
  app.get("/api/auth/me", (_req, res) => res.json({ user: res.locals.user }));
  app.put("/api/auth/me", (req, res) => {
    const { name, email } = req.body ?? {};
    const error = profileError(name, email);
    if (error) return res.status(400).json({ error });
    try {
      db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
        .run(name.trim(), normalizedEmail(email), res.locals.user.id);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?")
        .get(res.locals.user.id) as User;
      res.json({ user });
    } catch (failure) {
      if ((failure as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE")
        return res.status(409).json({ error: "An account with this email already exists." });
      throw failure;
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const token = sessionToken(req);
    if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
    clearSessionCookie(res);
    res.status(204).end();
  });

}
