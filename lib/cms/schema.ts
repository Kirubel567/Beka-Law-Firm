import type { CollectionDef } from "./types";

/**
 * The Phase 1 content model. Every field below is trilingual — staff enter or
 * update each language independently (the proposal's translation workflow).
 */
export const collections: CollectionDef[] = [
  {
    slug: "testimonials",
    label: "Testimonials",
    description: "Client remarks, reproduced with written consent and without names.",
    titleField: "attribution",
    hasSlug: false,
    hasDate: false,
    hasImage: false,
    fields: [
      { name: "text", label: "Remark", type: "textarea", required: true },
      {
        name: "attribution",
        label: "Attribution",
        type: "text",
        required: true,
        hint: "Role and sector only — never a name. e.g. “General counsel, a regional financial institution”",
      },
    ],
  },
  {
    slug: "articles",
    label: "Insights / Articles",
    description: "Editorial notes with unique URLs and per-article SEO metadata.",
    titleField: "title",
    hasSlug: true,
    hasDate: true,
    hasImage: false,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category", label: "Category", type: "text", hint: "e.g. Investment, Disputes, Regulation" },
      { name: "excerpt", label: "Excerpt", type: "textarea", hint: "Shown on the list page and as the article lede." },
      {
        name: "body",
        label: "Body",
        type: "paragraphs",
        hint: "Separate paragraphs with a blank line.",
      },
      { name: "seoTitle", label: "SEO title", type: "text", hint: "Optional — overrides the title in search results." },
      { name: "seoDescription", label: "SEO description", type: "textarea", hint: "Optional — overrides the excerpt in search results." },
    ],
  },
  {
    slug: "people",
    label: "People / Profiles",
    description: "Partner and staff profiles — presented as custodians of their fields.",
    titleField: "name",
    hasSlug: true,
    hasDate: false,
    hasImage: true,
    imageLabel: "Portrait",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text", hint: "e.g. Founding & Managing Partner" },
      { name: "custodyOf", label: "In custody", type: "text", hint: "Domains, separated by · " },
      { name: "languages", label: "Languages", type: "text" },
      { name: "bio", label: "Biography", type: "paragraphs", hint: "Separate paragraphs with a blank line." },
      { name: "credentials", label: "Of record (credentials)", type: "lines", hint: "One credential per line." },
    ],
  },
  {
    slug: "matters",
    label: "Matters / Case studies",
    description: "Anonymized matter narratives — the substance without the fingerprints.",
    titleField: "headline",
    hasSlug: false,
    hasDate: false,
    hasImage: false,
    fields: [
      { name: "sector", label: "Sector label", type: "text", hint: "e.g. Corporate / Cross-border" },
      { name: "headline", label: "Headline", type: "textarea", required: true },
      {
        name: "facts",
        label: "Fact ledger",
        type: "pairs",
        hint: "One per line, as “Label | Value”. e.g. Role | Ethiopian counsel of record",
      },
    ],
  },
];

export function getCollection(slug: string): CollectionDef | undefined {
  return collections.find((c) => c.slug === slug);
}
