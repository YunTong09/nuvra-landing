import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import type { Request, Response } from "express";

const options = { N: 1 << 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
function derivePassword(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, 64, options, (error, derived) =>
      error ? reject(error) : resolve(derived as Buffer)));
}
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
export const sessionCookie = process.env.VERCEL ? "__Host-nuvra_session" : "nuvra_session";
export const dummyPasswordHash = `scrypt$32768$8$3$${"00".repeat(16)}$${"00".repeat(64)}`;
export const normalizedEmail = (email: string) => email.trim().toLowerCase();

export function profileError(name: unknown, email: unknown) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100)
    return "Enter a name of 1–100 characters.";
  if (typeof email !== "string" || email.length > 254 ||
      !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim()))
    return "Enter a valid email address.";
  return "";
}

export function registrationError(name: unknown, email: unknown, password: unknown) {
  const error = profileError(name, email);
  if (error) return error;
  if (typeof password !== "string" || password.length < 12 || password.length > 128)
    return "Use a password of 12–128 characters.";
  return "";
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePassword(password, salt);
  return `scrypt$32768$8$3$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  if (N !== 32768 || r !== 8 || p !== 3 || salt.length !== 16 || expected.length !== 64)
    return false;
  const actual = await derivePassword(password, salt);
  return timingSafeEqual(actual, expected);
}

export function newSession() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token).digest("hex") };
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function clientKey(req: Request) {
  const address = process.env.VERCEL ? req.get("X-Vercel-Forwarded-For") || req.ip : req.ip;
  return createHash("sha256").update(address || "unknown").digest("hex");
}
export function sessionToken(req: Request) {
  const match = req.headers.cookie?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${sessionCookie}=`));
  const token = match?.slice(sessionCookie.length + 1);
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}
export function setSessionCookie(res: Response, token: string) {
  res.cookie(sessionCookie, token, {
    httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: "strict",
    path: "/", maxAge: sessionDurationMs,
  });
  res.set("Cache-Control", "no-store");
}
export function clearSessionCookie(res: Response) {
  res.clearCookie(sessionCookie, {
    httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: "strict", path: "/",
  });
  res.set("Cache-Control", "no-store");
}
export function sameOriginMutation(req: Request) {
  const origin = req.get("Origin");
  const host = req.get("Host") || "";
  const peer = req.socket.remoteAddress || "";
  const localProxy = !process.env.VERCEL &&
    /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) &&
    (peer === "127.0.0.1" || peer === "::1" || peer === "::ffff:127.0.0.1") &&
    Boolean(origin && /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin));
  if (req.get("Sec-Fetch-Site") && req.get("Sec-Fetch-Site") !== "same-origin" && !localProxy)
    return false;
  if (origin) {
    const expected = `${req.get("X-Forwarded-Proto") || req.protocol}://${host}`;
    if (origin !== expected && !localProxy) return false;
  }
  return req.get("X-Nuvra-Request") === "1";
}
