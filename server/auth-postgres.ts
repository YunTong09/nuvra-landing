import type { Express, Request, Response } from "express";
import type { Pool } from "pg";
import {
  clearSessionCookie, clientKey, dummyPasswordHash, hashPassword, newSession, normalizedEmail,
  registrationError, sameOriginMutation, sessionDurationMs, sessionToken,
  setSessionCookie, tokenHash, verifyPassword,
} from "./auth-core.ts";

type User = { id: number; name: string; email: string; role: "user" | "admin" };
const fullPath = (req: Request) => req.baseUrl + req.path;
const publicRead = (req: Request) => req.method === "GET" && fullPath(req) === "/api/tools";
const adminPath = (req: Request) =>
  fullPath(req).startsWith("/api/clients") || fullPath(req).startsWith("/api/subscriptions") ||
  (fullPath(req).startsWith("/api/tools") && req.method !== "GET");

export function registerPostgresAuth(app: Express, db: Pool) {
  async function attempts(key: string) {
    const result = await db.query(`INSERT INTO auth_attempts (key, attempts, window_start)
      VALUES ($1, 0, now()) ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN auth_attempts.window_start < now() - interval '15 minutes'
        THEN 0 ELSE auth_attempts.attempts END,
      window_start = CASE WHEN auth_attempts.window_start < now() - interval '15 minutes'
        THEN now() ELSE auth_attempts.window_start END RETURNING attempts`, [key]);
    return Number(result.rows[0].attempts);
  }
  async function increment(key: string) {
    await db.query("UPDATE auth_attempts SET attempts = attempts + 1 WHERE key = $1", [key]);
  }
  app.use("/api", async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (mutation && fullPath(req) !== "/api/contact" && !sameOriginMutation(req))
      return res.status(403).json({ error: "Request could not be verified." });
    if (fullPath(req) === "/api/contact" || publicRead(req) || fullPath(req) === "/api/auth/register" ||
        fullPath(req) === "/api/auth/login") return next();
    const token = sessionToken(req);
    if (!token) return res.status(401).json({ error: "Please log in." });
    const result = await db.query(`SELECT users.id, users.name, users.email, users.role
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`, [tokenHash(token)]);
    const user = result.rows[0] as User | undefined;
    if (!user) return res.status(401).json({ error: "Please log in." });
    res.locals.user = user;
    if (adminPath(req) && user.role !== "admin")
      return res.status(403).json({ error: "Administrator access required." });
    next();
  });

  async function issueSession(user: User, res: Response) {
    const { token, hash } = newSession();
    await db.query("DELETE FROM sessions WHERE expires_at <= now()");
    await db.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
      [hash, user.id, new Date(Date.now() + sessionDurationMs)]);
    setSessionCookie(res, token);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body ?? {};
    const error = registrationError(name, email, password);
    if (error) return res.status(400).json({ error });
    const emailValue = normalizedEmail(email);
    const registrationKey = `register:${clientKey(req)}`;
    if (await attempts(registrationKey) >= 10)
      return res.status(429).json({ error: "Too many registrations. Try again later." });
    const existing = await db.query("SELECT 1 FROM users WHERE lower(email) = $1", [emailValue]);
    if (existing.rowCount)
      return res.status(409).json({ error: "An account with this email already exists." });
    await increment(registrationKey);
    const passwordHash = await hashPassword(password);
    try {
      const result = await db.query(`INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3) RETURNING id, name, email, role`, [name.trim(), emailValue, passwordHash]);
      res.status(201).json({ user: await issueSession(result.rows[0], res) });
    } catch (failure) {
      if ((failure as { code?: string }).code === "23505")
        return res.status(409).json({ error: "An account with this email already exists." });
      throw failure;
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || email.length > 254 || typeof password !== "string" || password.length > 128)
      return res.status(400).json({ error: "Enter your email and password." });
    const emailValue = normalizedEmail(email);
    const limitKey = `login:${emailValue}`;
    const ipKey = `login-ip:${clientKey(req)}`;
    if (await attempts(limitKey) >= 5 || await attempts(ipKey) >= 20)
      return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    const result = await db.query("SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = $1", [emailValue]);
    const user = result.rows[0];
    const verified = await verifyPassword(password, user?.password_hash ?? dummyPasswordHash);
    if (!user || !verified) {
      await increment(limitKey);
      await increment(ipKey);
      return res.status(401).json({ error: "Invalid email or password." });
    }
    await db.query("DELETE FROM auth_attempts WHERE key = $1", [limitKey]);
    res.json({ user: await issueSession(user, res) });
  });
  app.get("/api/auth/me", (_req, res) => res.json({ user: res.locals.user }));
  app.post("/api/auth/logout", async (req, res) => {
    const token = sessionToken(req);
    if (token) await db.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
    clearSessionCookie(res);
    res.status(204).end();
  });

}
