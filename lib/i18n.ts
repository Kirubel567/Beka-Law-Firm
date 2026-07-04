import { en } from "./content/en";
import { am } from "./content/am";
import { om } from "./content/om";
import type { Dict, Locale } from "./content/types";

export const locales: Locale[] = ["en", "am", "om"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromoo",
};

const dicts: Record<Locale, Dict> = { en, am, om };

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}

export function getDict(locale: string): Dict {
  return isLocale(locale) ? dicts[locale] : dicts.en;
}

export function formatDate(iso: string, locale: Locale): string {
  const tag = locale === "am" ? "am-ET" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
