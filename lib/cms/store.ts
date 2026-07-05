import fs from "node:fs";
import path from "node:path";
import type { Dict, Locale } from "@/lib/content/types";
import { en } from "@/lib/content/en";
import { am } from "@/lib/content/am";
import { om } from "@/lib/content/om";
import type { CmsItem, SiteSettings } from "./types";

/**
 * File-backed content store for Phase 1. Collections live as JSON under /data,
 * auto-seeded from the shipped trilingual dictionaries on first access, so the
 * portal opens pre-populated and the public site never renders empty.
 * The read/write surface below is deliberately the shape of a database DAO —
 * swapping in Postgres/SQLite later touches only this file.
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

function filePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

function ensureDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function listItems(collection: string): CmsItem[] {
  ensureDir();
  const file = filePath(collection);
  if (!fs.existsSync(file)) {
    const seed = seedItems(collection);
    fs.writeFileSync(file, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  try {
    const items = JSON.parse(fs.readFileSync(file, "utf8")) as CmsItem[];
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

export function getItem(collection: string, id: string): CmsItem | undefined {
  return listItems(collection).find((i) => i.id === id);
}

function writeItems(collection: string, items: CmsItem[]): void {
  ensureDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(items, null, 2), "utf8");
}

export function upsertItem(collection: string, item: CmsItem): CmsItem {
  const items = listItems(collection);
  const idx = items.findIndex((i) => i.id === item.id);
  const stored: CmsItem = { ...item, updatedAt: now() };
  if (idx === -1) {
    stored.createdAt = now();
    items.push(stored);
  } else {
    stored.createdAt = items[idx].createdAt;
    items[idx] = stored;
  }
  writeItems(collection, items);
  return stored;
}

export function deleteItem(collection: string, id: string): boolean {
  const items = listItems(collection);
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  writeItems(collection, next);
  return true;
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

const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");

export function listInquiries(): Inquiry[] {
  ensureDir();
  if (!fs.existsSync(INQUIRIES_FILE)) return [];
  try {
    const items = JSON.parse(fs.readFileSync(INQUIRIES_FILE, "utf8")) as Inquiry[];
    return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function addInquiry(inquiry: Omit<Inquiry, "id" | "createdAt">): Inquiry {
  const items = listInquiries();
  const stored: Inquiry = { ...inquiry, id: crypto.randomUUID(), createdAt: now() };
  items.unshift(stored);
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(items, null, 2), "utf8");
  return stored;
}

export function deleteInquiry(id: string): boolean {
  const items = listInquiries();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(next, null, 2), "utf8");
  return true;
}

/* ——— site settings (hero image, contact details) ——— */

const SITE_FILE = path.join(DATA_DIR, "site.json");

export function getSite(): SiteSettings {
  ensureDir();
  if (!fs.existsSync(SITE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SITE_FILE, "utf8")) as SiteSettings;
  } catch {
    return {};
  }
}

export function saveSite(settings: SiteSettings): void {
  ensureDir();
  fs.writeFileSync(SITE_FILE, JSON.stringify(settings, null, 2), "utf8");
}
