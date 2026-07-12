import fs from "node:fs";
import path from "node:path";
import type { Dict, Locale } from "@/lib/content/types";
import { en } from "@/lib/content/en";
import { am } from "@/lib/content/am";
import { om } from "@/lib/content/om";
import { getDb } from "@/lib/db";
import type { CmsItem, SiteSettings } from "./types";

/**
 * SQLite-backed content store. Collections are seeded from the shipped
 * trilingual dictionaries on first access (or imported from the legacy
 * data/*.json files if this install predates the database), so the portal
 * opens pre-populated and the public site never renders empty.
 */

const DATA_DIR = path.join(process.cwd(), "data");

const dicts: Record<Locale, Dict> = { en, am, om };
const localeKeys: Locale[] = ["en", "am", "om"];

function now(): string {
  return new Date().toISOString();
}

function seedItems(collection: string): CmsItem[] {
  const stamp = now();
  const base = (i: number): Pick<CmsItem, "status" | "order" | "createdAt" | "updatedAt"> => ({
    status: "published",
    order: i + 1,
    createdAt: stamp,
    updatedAt: stamp,
  });

  switch (collection) {
    case "testimonials":
      return dicts.en.home.quotes.map((_, i) => ({
        id: `seed-testimonial-${i + 1}`,
        ...base(i),
        locales: Object.fromEntries(
          localeKeys.map((l) => [l, { ...dicts[l].home.quotes[i] }]),
        ),
      }));
    case "articles":
      return dicts.en.insights.articles.map((a, i) => ({
        id: `seed-article-${i + 1}`,
        ...base(i),
        slug: a.slug,
        date: a.date,
        locales: Object.fromEntries(
          localeKeys.map((l) => {
            const src = dicts[l].insights.articles[i];
            return [
              l,
              {
                title: src.title,
                category: src.category,
                excerpt: src.excerpt,
                body: src.body,
                seoTitle: "",
                seoDescription: "",
              },
            ];
          }),
        ),
      }));
    case "people":
      return dicts.en.people.partners.map((p, i) => ({
        id: `seed-person-${i + 1}`,
        ...base(i),
        slug: p.slug,
        locales: Object.fromEntries(
          localeKeys.map((l) => {
            const src = dicts[l].people.partners[i];
            return [
              l,
              {
                name: src.name,
                role: src.role,
                custodyOf: src.custodyOf,
                languages: src.languages,
                bio: src.bio,
                credentials: src.credentials,
              },
            ];
          }),
        ),
      }));
    case "matters":
      return dicts.en.matters.items.map((_, i) => ({
        id: `seed-matter-${i + 1}`,
        ...base(i),
        locales: Object.fromEntries(
          localeKeys.map((l) => {
            const src = dicts[l].matters.items[i];
            return [l, { sector: src.sector, headline: src.headline, facts: src.facts }];
          }),
        ),
      }));
    default:
      return [];
  }
}

/* ——— row mapping ——— */

interface ItemRow {
  id: string;
  status: string;
  ord: number;
  slug: string | null;
  date: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  locales: string;
}

function rowToItem(r: ItemRow): CmsItem {
  return {
    id: r.id,
    status: r.status === "published" ? "published" : "draft",
    order: r.ord,
    slug: r.slug ?? undefined,
    date: r.date ?? undefined,
    image: r.image,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    locales: JSON.parse(r.locales) as CmsItem["locales"],
  };
}

function insertItem(collection: string, item: CmsItem): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO items
         (collection, id, status, ord, slug, date, image, created_at, updated_at, locales)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      collection,
      item.id,
      item.status,
      item.order,
      item.slug ?? null,
      item.date ?? null,
      item.image ?? null,
      item.createdAt,
      item.updatedAt,
      JSON.stringify(item.locales ?? {}),
    );
}

/* ——— one-time seed / legacy-JSON import per collection ——— */

function legacyFile(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

function readLegacy<T>(name: string): T[] | null {
  const file = legacyFile(name);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T[];
  } catch {
    return null;
  }
}

/** After a successful import the JSON file is renamed, so it can never be
 * imported twice and the old content remains on disk as a safety net. */
function retireLegacy(name: string): void {
  const file = legacyFile(name);
  try {
    if (fs.existsSync(file)) fs.renameSync(file, `${file}.imported`);
  } catch {
    // non-fatal: worst case the file lingers, but row counts guard re-import
  }
}

const ensured = new Set<string>();

function ensureCollection(collection: string): void {
  if (ensured.has(collection)) return;
  ensured.add(collection);
  const db = getDb();
  const count = (
    db.prepare("SELECT COUNT(*) AS c FROM items WHERE collection = ?").get(collection) as {
      c: number;
    }
  ).c;
  if (count > 0) return;

  const legacy = readLegacy<CmsItem>(collection);
  const items = legacy && legacy.length > 0 ? legacy : seedItems(collection);
  const insertAll = db.transaction((rows: CmsItem[]) => {
    for (const item of rows) insertItem(collection, item);
  });
  insertAll(items);
  if (legacy) retireLegacy(collection);
}

/* ——— public store API (signatures unchanged) ——— */

export function listItems(collection: string): CmsItem[] {
  ensureCollection(collection);
  const rows = getDb()
    .prepare("SELECT * FROM items WHERE collection = ? ORDER BY ord ASC")
    .all(collection) as ItemRow[];
  return rows.map(rowToItem);
}

export function getItem(collection: string, id: string): CmsItem | undefined {
  ensureCollection(collection);
  const row = getDb()
    .prepare("SELECT * FROM items WHERE collection = ? AND id = ?")
    .get(collection, id) as ItemRow | undefined;
  return row ? rowToItem(row) : undefined;
}

export function upsertItem(collection: string, item: CmsItem): CmsItem {
  ensureCollection(collection);
  const existing = getItem(collection, item.id);
  const stored: CmsItem = {
    ...item,
    createdAt: existing ? existing.createdAt : now(),
    updatedAt: now(),
  };
  insertItem(collection, stored);
  return stored;
}

export function deleteItem(collection: string, id: string): boolean {
  ensureCollection(collection);
  const res = getDb()
    .prepare("DELETE FROM items WHERE collection = ? AND id = ?")
    .run(collection, id);
  return res.changes > 0;
}

/* ——— inquiries from the public contact form ——— */

export interface Inquiry {
  id: string;
  createdAt: string;
  name: string;
  organization: string;
  email: string;
  language: string;
  matter: string;
  message: string;
}

interface InquiryRow {
  id: string;
  created_at: string;
  name: string;
  organization: string;
  email: string;
  language: string;
  matter: string;
  message: string;
}

function rowToInquiry(r: InquiryRow): Inquiry {
  return {
    id: r.id,
    createdAt: r.created_at,
    name: r.name,
    organization: r.organization,
    email: r.email,
    language: r.language,
    matter: r.matter,
    message: r.message,
  };
}

let inquiriesEnsured = false;

function ensureInquiries(): void {
  if (inquiriesEnsured) return;
  inquiriesEnsured = true;
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS c FROM inquiries").get() as { c: number }).c;
  if (count > 0) return;
  const legacy = readLegacy<Inquiry>("inquiries");
  if (!legacy || legacy.length === 0) return;
  const insert = db.prepare(
    `INSERT OR REPLACE INTO inquiries
       (id, created_at, name, organization, email, language, matter, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertAll = db.transaction((rows: Inquiry[]) => {
    for (const q of rows) {
      insert.run(
        q.id,
        q.createdAt,
        q.name,
        q.organization ?? "",
        q.email,
        q.language ?? "",
        q.matter ?? "",
        q.message,
      );
    }
  });
  insertAll(legacy);
  retireLegacy("inquiries");
}

export function listInquiries(): Inquiry[] {
  ensureInquiries();
  const rows = getDb()
    .prepare("SELECT * FROM inquiries ORDER BY created_at DESC")
    .all() as InquiryRow[];
  return rows.map(rowToInquiry);
}

export function addInquiry(inquiry: Omit<Inquiry, "id" | "createdAt">): Inquiry {
  ensureInquiries();
  const stored: Inquiry = { ...inquiry, id: crypto.randomUUID(), createdAt: now() };
  getDb()
    .prepare(
      `INSERT INTO inquiries
         (id, created_at, name, organization, email, language, matter, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      stored.id,
      stored.createdAt,
      stored.name,
      stored.organization,
      stored.email,
      stored.language,
      stored.matter,
      stored.message,
    );
  return stored;
}

export function deleteInquiry(id: string): boolean {
  ensureInquiries();
  const res = getDb().prepare("DELETE FROM inquiries WHERE id = ?").run(id);
  return res.changes > 0;
}

/* ——— site settings (hero image, contact details) ——— */

const SITE_KEY = "site";
let siteEnsured = false;

function ensureSite(): void {
  if (siteEnsured) return;
  siteEnsured = true;
  const db = getDb();
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get(SITE_KEY);
  if (row) return;
  const file = legacyFile("site");
  if (!fs.existsSync(file)) return;
  try {
    const legacy = JSON.parse(fs.readFileSync(file, "utf8")) as SiteSettings;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)").run(
      SITE_KEY,
      JSON.stringify(legacy),
    );
    retireLegacy("site");
  } catch {
    // unreadable legacy settings: start fresh
  }
}

export function getSite(): SiteSettings {
  ensureSite();
  const row = getDb()
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .get(SITE_KEY) as { value: string } | undefined;
  if (!row?.value) return {};
  try {
    return JSON.parse(row.value) as SiteSettings;
  } catch {
    return {};
  }
}

export function saveSite(settings: SiteSettings): void {
  ensureSite();
  getDb()
    .prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)")
    .run(SITE_KEY, JSON.stringify(settings));
}
