import type { CollectionDef } from "@/lib/cms/types";
import type { Locale } from "@/lib/content/types";
import type { CmsItem } from "@/lib/cms/types";

/**
 * Small hand-rolled validators for the API surface — matches the project's
 * dependency-light style. Content payloads are checked against the
 * collection schema so the store only ever holds fields the editor knows.
 */

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 200;
}

export function isSlug(v: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length <= 80;
}

export function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

const LOCALES: Locale[] = ["en", "am", "om"];
const MAX_LOCALES_JSON = 200 * 1024; // 200 KB of content per item is generous

function isCleanValue(v: unknown): boolean {
  if (typeof v === "string") return true;
  if (Array.isArray(v)) {
    return v.every(
      (e) =>
        typeof e === "string" ||
        (e !== null &&
          typeof e === "object" &&
          !Array.isArray(e) &&
          Object.values(e as Record<string, unknown>).every((x) => typeof x === "string")),
    );
  }
  return false;
}

/**
 * Validates and strips an item's `locales` against the collection schema:
 * only known locales, only fields the collection defines, only string /
 * string-array / flat-object-array values. Returns the cleaned locales, or
 * an error string.
 */
export function cleanLocales(
  raw: unknown,
  def: CollectionDef,
): CmsItem["locales"] | { error: string } {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return { error: "locales must be an object" };
  if (JSON.stringify(raw).length > MAX_LOCALES_JSON) {
    return { error: "Content too large" };
  }
  const allowed = new Set(def.fields.map((f) => f.name));
  const out: CmsItem["locales"] = {};
  for (const [loc, fields] of Object.entries(raw as Record<string, unknown>)) {
    if (!LOCALES.includes(loc as Locale)) return { error: `Unknown locale “${loc}”` };
    if (fields === undefined || fields === null) continue;
    if (typeof fields !== "object" || Array.isArray(fields)) {
      return { error: `locales.${loc} must be an object` };
    }
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
      if (!allowed.has(k)) return { error: `Unknown field “${k}” for ${def.slug}` };
      if (v === undefined || v === null) continue;
      if (!isCleanValue(v)) return { error: `Field “${k}” has an unsupported value type` };
      cleaned[k] = v;
    }
    out[loc as Locale] = cleaned;
  }
  return out;
}
