import "server-only";

import { getArticles, getMatters, getPeople, getTestimonials } from "@/lib/cms/public";
import { getSite } from "@/lib/cms/store";
import { getDict } from "@/lib/i18n";
import type { WebsiteCorpusDocument } from "./types";

function clean(parts: Array<string | string[] | undefined | null>): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n\n")
    .trim();
}

function origin(): string {
  return (process.env.PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function document(path: string, title: string, text: string): WebsiteCorpusDocument {
  return {
    external_key: `website:${path}`,
    title,
    canonical_url: `${origin()}${path}`,
    text,
    language: "en",
  };
}

/** Export only already-published English website content. */
export function buildWebsiteCorpus(): WebsiteCorpusDocument[] {
  const dict = getDict("en");
  const site = getSite();
  const documents: WebsiteCorpusDocument[] = [
    document(
      "/en",
      "Belay Ketema & Partners LLP — Firm Overview",
      clean([
        dict.meta.description,
        dict.home.heroTitle,
        dict.home.heroLede,
        dict.home.ledger.map(([label, value]) => `${label}: ${value}`),
        site.phone ? `Telephone: ${site.phone}` : undefined,
        site.email ? `Email: ${site.email}` : undefined,
      ]),
    ),
    document(
      "/en/origins",
      "Beka Law Firm — Origins and Principles",
      clean([
        dict.origins.lede,
        dict.origins.story,
        dict.origins.principles.map((item) => `${item.title}\n${item.text}`),
        dict.origins.timeline.map((item) => `${item.year} — ${item.title}\n${item.text}`),
      ]),
    ),
    document(
      "/en/presence",
      "Beka Law Firm — Presence, Affiliations and Languages",
      clean([
        dict.presence.lede,
        dict.presence.blocks.map((item) => `${item.title}\n${item.text}`),
        `${dict.presence.affiliationsTitle}\n${dict.presence.affiliations.join("\n")}`,
        `${dict.presence.languagesTitle}\n${dict.presence.languages.join("\n")}`,
        `${dict.presence.jurisdictionsTitle}\n${dict.presence.jurisdictions.join("\n")}`,
      ]),
    ),
    document(
      "/en/discretion",
      "Beka Law Firm — Confidentiality and Discretion",
      clean([
        dict.discretion.lede,
        dict.discretion.principles.map((item) => `${item.title}\n${item.text}`),
        dict.discretion.closing,
      ]),
    ),
    document(
      "/en/careers",
      "Careers at Beka Law Firm",
      clean([dict.careers.lede, dict.careers.body, dict.careers.how, dict.careers.mailLine]),
    ),
    document(
      "/en/contact",
      "Contact Belay Ketema & Partners LLP",
      clean([
        dict.contact.lede,
        dict.contact.office.title,
        Object.values(dict.contact.office).filter((value): value is string => typeof value === "string"),
        site.phone ? `Telephone: ${site.phone}` : undefined,
        site.email ? `Email: ${site.email}` : undefined,
      ]),
    ),
  ];

  for (const area of dict.practice.areas) {
    documents.push(
      document(
        `/en/practice/${area.slug}`,
        `Beka Law Firm Practice — ${area.name}`,
        clean([area.oneLine, area.detail, area.representative]),
      ),
    );
  }
  for (const person of getPeople("en")) {
    documents.push(
      document(
        `/en/people/${person.slug}`,
        `${person.name} — ${person.role}`,
        clean([
          person.custodyOf,
          `Languages: ${person.languages}`,
          person.bio,
          person.credentials,
        ]),
      ),
    );
  }
  for (const article of getArticles("en")) {
    documents.push(
      document(
        `/en/insights/${article.slug}`,
        article.title,
        clean([article.category, article.date, article.excerpt, article.body]),
      ),
    );
  }
  const matters = getMatters("en");
  if (matters.length > 0) {
    documents.push(
      document(
        "/en/matters",
        "Beka Law Firm — Published Matter Summaries",
        clean(
          matters.map((matter) =>
            clean([
              matter.sector,
              matter.headline,
              matter.facts.map(([label, value]) => `${label}: ${value}`),
            ]),
          ),
        ),
      ),
    );
  }
  const testimonials = getTestimonials("en");
  if (testimonials.length > 0) {
    documents.push(
      document(
        "/en/testimonials",
        "Beka Law Firm — Published Testimonials",
        clean(testimonials.map((item) => `${item.text}\n— ${item.attribution}`)),
      ),
    );
  }
  return documents.filter((item) => item.text.length >= 20);
}
