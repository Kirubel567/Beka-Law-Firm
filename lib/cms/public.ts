import type { Article, Locale, Matter, Person, Quote } from "@/lib/content/types";
import { listItems } from "./store";
import type { CmsItem } from "./types";

/**
 * Read side for the public site: published items only, localized with
 * field-by-field fallback to English so a half-translated entry never
 * renders blank.
 */

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function localize<T extends object>(item: CmsItem, locale: Locale): T {
  const base = (item.locales.en ?? {}) as Record<string, unknown>;
  const loc = (item.locales[locale] ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(loc)) {
    if (!isEmpty(v)) merged[k] = v;
  }
  return merged as T;
}

function published(collection: string): CmsItem[] {
  return listItems(collection).filter((i) => i.status === "published");
}

export function getTestimonials(locale: Locale): Quote[] {
  return published("testimonials").map((i) => localize<Quote>(i, locale));
}

export function getArticles(locale: Locale): Article[] {
  return published("articles")
    .map((i) => ({
      ...localize<Omit<Article, "slug" | "date">>(i, locale),
      slug: i.slug ?? i.id,
      date: i.date ?? i.createdAt.slice(0, 10),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getArticle(locale: Locale, slug: string): (Article & { seoTitle?: string; seoDescription?: string }) | undefined {
  const item = published("articles").find((i) => i.slug === slug);
  if (!item) return undefined;
  return {
    ...localize<Omit<Article, "slug" | "date"> & { seoTitle?: string; seoDescription?: string }>(item, locale),
    slug,
    date: item.date ?? item.createdAt.slice(0, 10),
  };
}

export function getPeople(locale: Locale): Person[] {
  return published("people").map((i) => ({
    ...localize<Omit<Person, "slug">>(i, locale),
    slug: i.slug ?? i.id,
  }));
}

export function getPerson(locale: Locale, slug: string): Person | undefined {
  const item = published("people").find((i) => i.slug === slug);
  if (!item) return undefined;
  return { ...localize<Omit<Person, "slug">>(item, locale), slug };
}

export function getMatters(locale: Locale): Matter[] {
  return published("matters").map((i) => localize<Matter>(i, locale));
}
