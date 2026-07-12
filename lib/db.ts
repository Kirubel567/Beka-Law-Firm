import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Single SQLite database for everything server-side: CMS content, inquiries,
 * site settings, and (Phase 2) users/sessions/audit. WAL mode so the portal
 * can write while public pages read. The connection is module-scoped and
 * reused across requests; `globalThis` caching keeps `next dev` HMR from
 * opening a new handle on every reload.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "beka.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS items (
  collection TEXT NOT NULL,
  id         TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  ord        INTEGER NOT NULL DEFAULT 0,
  slug       TEXT,
  date       TEXT,
  image      TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  locales    TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (collection, id)
);
CREATE INDEX IF NOT EXISTS idx_items_collection_ord ON items (collection, ord);
CREATE INDEX IF NOT EXISTS idx_items_slug ON items (collection, slug);

CREATE TABLE IF NOT EXISTS inquiries (
  id           TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL,
  name         TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT '',
  matter       TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Phase 2 tables, created now so migrations stay linear
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor')),
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  disabled      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  at         TEXT NOT NULL,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  collection TEXT,
  item_id    TEXT,
  detail     TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log (at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  key        TEXT PRIMARY KEY,
  fails      INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
`;

function open(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

const g = globalThis as unknown as { __bekaDb?: Database.Database };

export function getDb(): Database.Database {
  if (!g.__bekaDb) {
    g.__bekaDb = open();
  }
  return g.__bekaDb;
}

export { DB_FILE };
