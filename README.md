# Belay Ketema & Partners LLP — Firm Website

Trilingual (English / አማርኛ / Afaan Oromoo) website for BEKA Law Firm, built as
Phase 1 of the ZAKE Tech Group proposal. Design concept: **"The Unbroken Line"** —
a chaptered chronicle rather than a brochure, with a brass-thread motif, a
scroll-drawn timeline, and a seal-confirmation inquiry flow.

## Stack

- **Next.js 15** (App Router, fully static — every page prerendered per locale)
- **TypeScript** — the content model is typed end-to-end
- **Tailwind CSS 4** — design tokens (basalt / parchment / brass / terracotta) in `app/globals.css`
- **Framer Motion** — weight-settling animation (`cubic-bezier(0.22,1,0.36,1)`), honors `prefers-reduced-motion`
- **Fonts** — Cormorant Garamond + Outfit for Latin, Noto Serif/Sans Ethiopic for Ge'ez,
  paired per-glyph so Amharic typography receives the same care as English

## Commands

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static production build (76 pages)
npm run start
```

## Structure

```
app/[locale]/          locale-prefixed routes: /en /am /om
  page.tsx             Home — hero, chapter index, practice, matters, quotes
  origins/             Chapter I  — story, principles, Unbroken Line timeline
  people/[slug]        Chapter II — partners as custodians
  practice/[slug]      Chapter III — nine practice areas
  matters/             Chapter IV — anonymized matter narratives
  presence/            Chapter V  — affiliations, languages, jurisdictions
  insights/[slug]      Chapter VI — articles with unique per-language URLs
  discretion/          the confidentiality page
  careers/  contact/
lib/content/           en.ts / am.ts / om.ts — one typed dictionary per language
components/            Header, Footer, Timeline, ContactForm, Motifs (seal, thread)
```

## Visual checks

`scripts/screenshots.mjs` and `scripts/scrollcheck.mjs` capture the site with
Playwright (`npx playwright install chromium` first; set
`PLAYWRIGHT_BROWSERS_PATH` if C: is short on space):

```bash
node scripts/screenshots.mjs <output-dir>
node scripts/scrollcheck.mjs <output-dir> /en/origins origins
```

## Staff portal (CMS) — `/admin`

The Phase 1 content portal from the proposal. Sign in at `/admin` with the
credentials in `.env.local` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`; copy
`.env.example` and change them before any deployment).

What staff can manage, without a developer:

- **Testimonials, Insights/Articles, People/Profiles, Matters** — full
  create/edit/delete, each with **English / አማርኛ / Afaan Oromoo fields entered
  independently** (empty translations fall back to English field-by-field)
- **Draft → publish workflow** — drafts never appear on the public site
- **Per-article SEO** — title/description overrides and editable URL slugs
- **Site settings** — homepage hero image upload (rendered behind a basalt
  overlay), telephone and email
- **Inquiries** — consultation requests from the contact form land here

Content lives as JSON in `data/` (auto-seeded from the shipped dictionaries on
first run) and uploads in `public/uploads/` — both gitignored. The store layer
(`lib/cms/store.ts`) is shaped like a database DAO, so moving to
Postgres/SQLite later touches one file. Note for hosting: the file store needs
a persistent disk (a VPS or container volume), not a serverless filesystem.

Auth is a signed HttpOnly session cookie (HMAC-SHA256, `AUTH_SECRET`) enforced
by `middleware.ts` over `/admin` and `/api/admin`. Single shared staff login for
Phase 1 — per-user accounts and roles arrive with the Phase 2 portal work.

## Editing UI text

Page furniture (navigation, section headings, form labels) lives in
`lib/content/{en,am,om}.ts` behind the `Dict` interface in
`lib/content/types.ts`. Collection content (articles, people, matters,
testimonials) is managed in the portal.

## Before launch — items needing firm sign-off

- **Dates and credentials**: founding year (1990), timeline dates, and partner
  bios are drafted from public sources and must be verified by the partners.
- **Contact details**: the phone number is a placeholder (`+251 11 XXX XXXX`);
  the street address is omitted pending confirmation.
- **Translations**: Amharic and Afaan Oromoo copy should pass professional
  legal-terminology review (the proposal assigns this to the client).
- **Testimonials**: the three seeded quotes are illustrative placeholders —
  replace with real consented quotes via the portal.
- **Portal credentials**: change `ADMIN_PASSWORD` and `AUTH_SECRET` in
  `.env.local` before deployment, and serve over HTTPS.
