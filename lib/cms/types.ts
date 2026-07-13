import type { Locale } from "@/lib/content/types";

export type CmsStatus = "draft" | "published";

export interface CmsItem {
  id: string;
  status: CmsStatus;
  /** display/sort order, ascending */
  order: number;
  slug?: string;
  date?: string;
  /** uploaded image path (e.g. a portrait) — not localized */
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  /** per-language content; English is the base, other locales fall back to it field-by-field */
  locales: Partial<Record<Locale, Record<string, unknown>>>;
}

export interface SocialLink {
  /** platform key — drives the icon (linkedin, facebook, x, instagram, telegram, youtube, tiktok) */
  platform: string;
  url: string;
}

export interface SiteSettings {
  phone?: string;
  email?: string;
  /** legacy single hero image — kept so older saved settings still resolve */
  heroImage?: string | null;
  /** hero images to shuffle through; when set, supersedes heroImage */
  heroImages?: string[];
  /** seconds each hero image is shown before crossfading to the next */
  heroIntervalSec?: number;
  /** the firm's social profiles, shown in the footer */
  social?: SocialLink[];
}

export type FieldType = "text" | "textarea" | "paragraphs" | "lines" | "pairs" | "date";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  hint?: string;
  required?: boolean;
}

export interface CollectionDef {
  slug: string;
  label: string;
  description: string;
  /** which localized field to use as the row title in lists */
  titleField: string;
  hasSlug: boolean;
  hasDate: boolean;
  /** whether entries carry an uploaded image (e.g. portraits for people) */
  hasImage: boolean;
  imageLabel?: string;
  /** all content fields are localized — entered per language, independently */
  fields: FieldDef[];
}
