import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_MS, verifyToken } from "@/lib/auth";

/**
 * Users, sessions, login rate-limiting and the audit trail. Node-only —
 * never import from middleware (it runs on the Edge and cannot open SQLite).
 *
 * The first user is bootstrapped from ADMIN_USERNAME / ADMIN_PASSWORD the
 * first time anything touches the users table, so an existing install keeps
 * its login after upgrading to per-user accounts.
 */

export type Role = "admin" | "editor";

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
}

export interface PortalUser extends SessionUser {
  createdAt: string;
  disabled: boolean;
}

/* ——— password hashing (scrypt, node:crypto — no dependencies) ——— */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `s2:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "s2") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

/* ——— bootstrap ——— */

function now(): string {
  return new Date().toISOString();
}

let bootstrapped = false;

function ensureUsers(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
  if (count > 0) return;
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return; // no env credentials: table stays empty
  db.prepare(
    `INSERT INTO users (id, username, display_name, role, password_hash, created_at)
     VALUES (?, ?, ?, 'admin', ?, ?)`,
  ).run(randomUUID(), username, "Administrator", hashPassword(password), now());
}

/* ——— row mapping ——— */

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  role: string;
  password_hash: string;
  created_at: string;
  disabled: number;
}

function rowToUser(r: UserRow): PortalUser {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    role: r.role === "admin" ? "admin" : "editor",
    createdAt: r.created_at,
    disabled: r.disabled === 1,
  };
}

/* ——— login with rate limiting ——— */

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; locked: boolean };

export function authenticate(username: string, password: string): AuthResult {
  ensureUsers();
  const db = getDb();
  const key = username.trim().toLowerCase();

  const attempt = db
    .prepare("SELECT fails, locked_until FROM login_attempts WHERE key = ?")
    .get(key) as { fails: number; locked_until: string | null } | undefined;
  if (attempt?.locked_until && attempt.locked_until > now()) {
    return { ok: false, locked: true };
  }

  const row = db
    .prepare("SELECT * FROM users WHERE username = ? AND disabled = 0")
    .get(username.trim()) as UserRow | undefined;
  const valid = row ? verifyPassword(password, row.password_hash) : false;

  if (!valid) {
    const fails = (attempt?.fails ?? 0) + 1;
    const lockedUntil = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS).toISOString() : null;
    db.prepare(
      `INSERT INTO login_attempts (key, fails, locked_until) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET fails = ?, locked_until = ?`,
    ).run(key, fails, lockedUntil, fails, lockedUntil);
    return { ok: false, locked: lockedUntil !== null };
  }

  db.prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
  const user = rowToUser(row!);
  return { ok: true, user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } };
}

/* ——— sessions ——— */

export function createSession(userId: string): string {
  const sid = randomBytes(24).toString("base64url");
  getDb()
    .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(sid, userId, now(), new Date(Date.now() + SESSION_TTL_MS).toISOString());
  return sid;
}

export function destroySession(sid: string): void {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sid);
}

export function destroyUserSessions(userId: string): void {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

function sessionUser(sid: string): SessionUser | null {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND u.disabled = 0`,
    )
    .get(sid) as UserRow | undefined;
  if (!row) return null;
  const u = rowToUser(row);
  return { id: u.id, username: u.username, displayName: u.displayName, role: u.role };
}

/** Resolve the current request's user from the session cookie, or null. */
export async function currentUser(): Promise<SessionUser | null> {
  ensureUsers();
  const jar = await cookies();
  const sid = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!sid) return null;
  return sessionUser(sid);
}

/* ——— user management (portal, admin role) ——— */

export function listUsers(): PortalUser[] {
  ensureUsers();
  const rows = getDb()
    .prepare("SELECT * FROM users ORDER BY created_at ASC")
    .all() as UserRow[];
  return rows.map(rowToUser);
}

export function getUser(id: string): PortalUser | undefined {
  ensureUsers();
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

export function createUser(input: {
  username: string;
  password: string;
  displayName?: string;
  role?: Role;
}): PortalUser | { error: string } {
  ensureUsers();
  const username = input.username.trim();
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return { error: "Username must be 3–40 characters (letters, digits, . _ -)" };
  }
  if (input.password.length < 10) {
    return { error: "Password must be at least 10 characters" };
  }
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
  if (exists) return { error: "Username already taken" };
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, username, display_name, role, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    username,
    (input.displayName ?? "").trim(),
    input.role === "admin" ? "admin" : "editor",
    hashPassword(input.password),
    now(),
  );
  return getUser(id)!;
}

function activeAdminCount(exceptId?: string): number {
  const db = getDb();
  return (
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND disabled = 0 AND id != ?",
      )
      .get(exceptId ?? "") as { c: number }
  ).c;
}

export function updateUser(
  id: string,
  patch: { displayName?: string; role?: Role; password?: string; disabled?: boolean },
): PortalUser | { error: string } {
  ensureUsers();
  const existing = getUser(id);
  if (!existing) return { error: "Not found" };

  // never let the firm lock itself out: the last active admin can't be
  // demoted or disabled
  const losesAdmin =
    (patch.role === "editor" && existing.role === "admin") ||
    (patch.disabled === true && existing.role === "admin" && !existing.disabled);
  if (losesAdmin && activeAdminCount(id) === 0) {
    return { error: "Cannot demote or disable the last administrator" };
  }
  if (patch.password !== undefined && patch.password.length < 10) {
    return { error: "Password must be at least 10 characters" };
  }

  const db = getDb();
  if (patch.displayName !== undefined) {
    db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(patch.displayName.trim(), id);
  }
  if (patch.role !== undefined) {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(patch.role === "admin" ? "admin" : "editor", id);
  }
  if (patch.password !== undefined) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(patch.password), id);
    destroyUserSessions(id);
  }
  if (patch.disabled !== undefined) {
    db.prepare("UPDATE users SET disabled = ? WHERE id = ?").run(patch.disabled ? 1 : 0, id);
    if (patch.disabled) destroyUserSessions(id);
  }
  return getUser(id)!;
}

export function deleteUser(id: string): { ok: true } | { error: string } {
  ensureUsers();
  const existing = getUser(id);
  if (!existing) return { error: "Not found" };
  if (existing.role === "admin" && !existing.disabled && activeAdminCount(id) === 0) {
    return { error: "Cannot delete the last administrator" };
  }
  destroyUserSessions(id);
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
  return { ok: true };
}

/* ——— audit trail ——— */

export interface AuditEntry {
  id: number;
  at: string;
  actor: string;
  action: string;
  collection: string | null;
  itemId: string | null;
  detail: string | null;
}

export function audit(
  actor: string,
  action: string,
  extra?: { collection?: string; itemId?: string; detail?: string },
): void {
  getDb()
    .prepare(
      "INSERT INTO audit_log (at, actor, action, collection, item_id, detail) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(now(), actor, action, extra?.collection ?? null, extra?.itemId ?? null, extra?.detail ?? null);
}

export function listAudit(limit = 200): AuditEntry[] {
  const rows = getDb()
    .prepare(
      "SELECT id, at, actor, action, collection, item_id, detail FROM audit_log ORDER BY id DESC LIMIT ?",
    )
    .all(limit) as Array<{
    id: number;
    at: string;
    actor: string;
    action: string;
    collection: string | null;
    item_id: string | null;
    detail: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    at: r.at,
    actor: r.actor,
    action: r.action,
    collection: r.collection,
    itemId: r.item_id,
    detail: r.detail,
  }));
}
