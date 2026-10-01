import crypto from "node:crypto";
import bcrypt from "bcryptjs";

// E.164: + followed by 8-15 digits, first digit 1-9. Covers any country's
// numbers in their international format (e.g. +2348012345678, +14155552671).
// Client-side validation should use this exact same pattern so obviously
// malformed numbers never reach here in the first place.
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function isValidPhone(phone: string): boolean {
  return E164_PATTERN.test(phone);
}

export function generateOtpCode(): string {
  // 6-digit numeric code, zero-padded (e.g. "004821"). crypto.randomInt is
  // cryptographically secure, unlike Math.random.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// --- Minimal session store -------------------------------------------------
// In-memory, single-instance only. Good enough for local dev / a single
// deployed instance; replace with a signed JWT or a shared store (Redis,
// or a `sessions` DB table) before running more than one server process.
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): string {
  const token = generateOpaqueToken();
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getUserIdForSession(token: string | undefined): string | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return null;
  return session.userId;
}

export function destroySession(token: string | undefined): void {
  if (token) sessions.delete(token);
}

export const SESSION_COOKIE_NAME = "plasticbyte_session";

export function extractSessionToken(req: { cookies?: Record<string, string>; headers?: Record<string, string | string[] | undefined> }): string | undefined {
  if (req.cookies?.[SESSION_COOKIE_NAME]) return req.cookies[SESSION_COOKIE_NAME];
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}
