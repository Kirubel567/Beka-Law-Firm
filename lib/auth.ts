/**
 * Signed-cookie session token for the staff portal. Edge-safe: uses only Web
 * Crypto, so the same code runs in middleware and route handlers.
 *
 * Token format: `<sessionId>.<expiresAtMs>.<hmac>`. The signature lets the
 * Edge middleware reject forged/expired cookies without touching the
 * database; route handlers then resolve the session id against the DB
 * (lib/users.ts), which is what makes sessions revocable per user.
 */

const encoder = new TextEncoder();

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export const SESSION_COOKIE = "beka_admin";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

async function hmacHex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken(sessionId: string): Promise<string> {
  const exp = String(Date.now() + SESSION_TTL_MS);
  const payload = `${sessionId}.${exp}`;
  const sig = await hmacHex(payload, getSecret());
  return `${payload}.${sig}`;
}

/** Returns the session id when the signature and expiry check out, else null. */
export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [sid, exp, sig] = parts;
  if (!sid || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;
  const expected = await hmacHex(`${sid}.${exp}`, getSecret());
  if (sig.length !== expected.length) return null;
  // constant-time comparison
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? sid : null;
}
