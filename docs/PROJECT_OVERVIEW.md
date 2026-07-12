# BEKA Law Firm — Project Overview

This document exists so any teammate can pick up this codebase without a
handoff call. It explains **what** was built, **why** it was built that way,
and **what's left**. Read it top to bottom once, then use it as a reference.

If something here disagrees with the code, trust the code and fix this
document — it will drift over time, the source won't.

---

## 1. What this project is

A trilingual (English / Amharic / Afaan Oromoo) website for **Belay Ketema &
Partners LLP**, an Addis Ababa law firm, plus a private staff portal (CMS)
that lets non-technical staff manage the site's content without a developer.

The design concept is called **"The Unbroken Line"** — the site is framed as
a chaptered chronicle (Origins, People, Practice, Matters, Presence,
Insights…) rather than a typical brochure site. This shows up in real
product decisions: a scroll-drawn timeline component, a seal-confirmation
animation on the contact form, chapter numerals in navigation. It's not
decoration for its own sake — it's the brief we were given, and it's why the
codebase has bespoke components instead of a page builder.

### The business context (why this exists)

The client — ZAKE Tech Group — proposed a two-phase engagement to the firm:

1. **Phase 1 (done, this repo):** trilingual public website + staff CMS
   portal, replacing a static site that had no working blog, no article
   URLs, and a placeholder hero image.
2. **Phase 2 (not started):** a RAG-based AI legal research assistant,
   internal-only, grounded strictly in the firm's own documents.

Everything in this repository is Phase 1 of that proposal, **plus** a set of
backend hardening phases (our own internal numbering — see §3) that were
done after the initial build to take the portal from "working" to
"production-safe for a law firm."

**Don't confuse the two numbering schemes** — the proposal's "Phase 2" is
the future AI assistant. Our internal "Backend Phase 1/2/3" (database, auth,
hardening) are all *inside* the proposal's Phase 1. See §3 for the mapping.

---

## 2. Tech stack, and why

| Choice | Why |
|---|---|
| **Next.js 15 (App Router)** | Public site is fully static-rendered per locale (`generateStaticParams`) for speed and cheap hosting; the portal uses `force-dynamic` routes since it's server-rendered per-request from the database. One framework, two rendering strategies, no separate backend service needed. |
| **TypeScript everywhere** | The content model (`lib/content/types.ts`) is one `Dict` interface implemented three times (`en.ts`, `am.ts`, `om.ts`). If a translator misses a field, the build fails — not a runtime blank spot on the live site. |
| **Tailwind CSS 4** | Design tokens (basalt / parchment / brass / terracotta) live in `app/globals.css`. Portal has a separate light/dark token set (`--p-*` custom properties). |
| **Framer Motion** | The "weight-settling" animation feel (`cubic-bezier(0.22,1,0.36,1)`) used across reveals, the timeline, and the contact form's seal. Respects `prefers-reduced-motion`. |
| **better-sqlite3** | Chosen over Postgres for a single-VPS deployment: zero ops burden, one file to back up, synchronous API (no async ceremony for a request-scoped read). See §5 for why this doesn't become a bottleneck. |
| **No ORM** | The schema is small and stable (4 collections + auth tables). Raw SQL in `lib/db.ts`/`lib/cms/store.ts` is fewer moving parts than Prisma/Drizzle for this scale, and every query is visible in one place. |
| **No auth library (NextAuth, etc.)** | Custom signed-cookie sessions (`lib/auth.ts`) because the requirement is simple (one staff portal, two roles, no OAuth, no third-party IdP) and a hand-rolled implementation is ~150 lines that's easy for the whole team to audit, versus depending on a library's abstractions for a problem this small. |
| **nodemailer, not a transactional-email API** | Inquiry notifications go over the firm's own SMTP account (see §7). No third-party service holds client correspondence. |

---

## 3. What's been built — phase by phase

### Proposal Phase 1: Trilingual website + CMS portal

This is the whole repo. Internally we further split the *backend* work into
three phases, done in this order because each depends on the last:

#### Backend Phase 1 — Database foundation
Replaced the original `data/*.json` file store with SQLite
(`data/beka.db`, WAL mode). See §4.

#### Backend Phase 2 — Accounts, roles, sessions, audit
Per-user logins (was: one shared `admin` login), two roles (`editor`,
`admin`), revocable database-backed sessions, login rate-limiting, and a
full audit trail. See §6.

#### Backend Phase 3 — Public-surface hardening
Server-side validation on every API input, spam defenses on the contact
form, optional email notifications, and upload content-sniffing. See §7.

### Proposal Phase 2: RAG AI legal assistant — **not started**

Deliberately deferred. See §9 for what it will need and how it plugs into
what exists today.

---

## 4. Content model — two systems, on purpose

This trips people up, so read carefully: **not all site text lives in the
database.** There are two separate content systems:

### 4a. Static typed dictionaries (`lib/content/{en,am,om}.ts`)

Page furniture — navigation labels, section headings, the "Origins" story
text, practice area descriptions, the timeline, footer copy — lives in three
files implementing the `Dict` interface (`lib/content/types.ts`). These are
**not editable from the portal.** Changing this text means editing code and
redeploying.

Why: this text changes rarely, needs a developer's judgment for tone/layout
anyway (it's prose, not data), and keeping it typed means a missing
translation is a **build-time TypeScript error**, not a silent English
fallback discovered by a client after launch.

### 4b. Database-backed collections (`lib/cms/schema.ts` + `lib/cms/store.ts`)

Four collections are fully staff-manageable from the portal, each with
independent English / Amharic / Afaan Oromoo fields:

| Collection | Slug | Has slug URL? | Has date? | Has image? |
|---|---|---|---|---|
| Testimonials | `testimonials` | no | no | no |
| Insights / Articles | `articles` | yes | yes | no |
| People / Profiles | `people` | yes | no | yes (portrait) |
| Matters / Case studies | `matters` | no | no | no |

The field list per collection is defined once in `lib/cms/schema.ts`
(`CollectionDef[]`) and drives **both** the portal's editor form
(`components/admin/EditorForm.tsx`) and the API's validation
(`lib/validate.ts`'s `cleanLocales`). Add a field there and it appears in
the editor automatically — no separate form-building step.

**Translation fallback:** if a staff member publishes an article in English
only, the Amharic and Oromo pages render the English text field-by-field
(not the whole item) until someone fills in that language. See
`lib/cms/public.ts`'s `localize()`. This is why the site never has visibly
blank sections, even mid-translation.

**Draft → publish:** every item has a `status` of `draft` or `published`.
Drafts are visible only inside the portal; `lib/cms/public.ts` filters to
`published` before anything reaches a public page.

---

## 5. Database — SQLite, and how the pieces fit

**File:** `data/beka.db` (WAL mode — readers don't block writers). This
directory is gitignored; the database is auto-created and auto-seeded on
first run.

**Schema** (`lib/db.ts`, `CREATE TABLE` statements run on every startup —
idempotent via `IF NOT EXISTS`):

- `items` — all four CMS collections in one table, keyed by
  `(collection, id)`. Localized content lives in a single `locales` TEXT
  column as JSON (`{"en": {...}, "am": {...}, "om": {...}}`). Not
  normalized into per-field columns — the field list varies per collection
  and changes over time, so a flexible JSON blob beats a wide sparse table
  or an EAV schema for this shape.
- `inquiries` — consultation requests from the public contact form.
- `site_settings` — a single row holding hero image / phone / email as JSON.
- `users`, `sessions`, `audit_log`, `login_attempts`, `rate_limits` —
  Backend Phase 2/3 tables (see §6, §7).

**The store layer (`lib/cms/store.ts`) is a deliberate seam.** Every
function (`listItems`, `getItem`, `upsertItem`, `deleteItem`, etc.) hides
SQL behind a plain-TypeScript API. If this ever needs to move to Postgres
(multi-instance deployment, replication, etc.), only this file changes —
every API route, every page, every component stays untouched. This was true
even before the SQLite migration (the original file-JSON store had the same
shape) — that's why the migration itself touched exactly one file plus the
new `lib/db.ts`.

**Migration path is automatic and one-way.** If you inherit a very old
checkout that still has `data/*.json` files, the store detects them, imports
their rows into SQLite on first access, and renames them `*.json.imported`
(never deletes — that's your rollback safety net). This logic lives in
`ensureCollection()` / `ensureInquiries()` / `ensureSite()` in
`lib/cms/store.ts`. You will not encounter this on a fresh clone.

**Backups:** `node scripts/backupdb.mjs [dir]` takes an online-safe backup
(safe to run while the server is serving traffic, because of WAL) and keeps
the newest 14. This is not automated (no cron) — that's Backend Phase 5
work (deployment), not done yet.

---

## 6. Authentication, roles, and sessions

### The model

Every staff member has their own account (`users` table): a username, a
`scrypt`-hashed password (`node:crypto`, no external dependency), a display
name, and a role — `editor` or `admin`.

- **Editor:** manage all CMS content (create/edit/delete/publish),
  manage site settings, view inquiries.
- **Admin:** everything an editor can do, **plus** manage staff accounts
  (`/admin/users`) and view the activity log (`/admin/audit`).

### How a session actually works (this is the part worth understanding)

The cookie (`beka_admin`) is **not** the session — it's a signed pointer to
one. The token format is `<sessionId>.<expiresAtMs>.<hmac>`.

1. `middleware.ts` runs on the Edge runtime and can verify the HMAC
   signature (`lib/auth.ts`'s `verifyToken`) without touching the database —
   Edge functions can't open a SQLite file. This is a fast, cheap "is this
   cookie forged or expired" check that blocks obviously-bad requests before
   they reach a route handler.
2. Route handlers then resolve the session id against the `sessions` table
   (`lib/users.ts`'s `currentUser()`) to get the actual user + role. This is
   the step that makes sessions **revocable**: disabling an account or
   resetting a password calls `destroyUserSessions()`, which deletes the
   row. The next request with that (still cryptographically valid) cookie
   fails at this step because the session row is gone — confirmed live in
   testing (§10).

This two-layer design is why you'll see both `lib/auth.ts` (token
signing/verification, Edge-safe) and `lib/users.ts` (everything that touches
the database — accounts, sessions, audit, rate limiting) as separate files.
**Never import `lib/users.ts` from `middleware.ts`** — it will break, because
Edge middleware cannot load `better-sqlite3`.

### Bootstrapping the first account

On a fresh database, the first login attempt triggers `ensureUsers()` in
`lib/users.ts`, which creates one `admin` account from the
`ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables (see
`.env.example`). After that, all account management happens in the portal —
those env vars are only read once, on an empty `users` table.

### Guardrails worth knowing about

- **Rate limiting:** 5 failed logins for a username locks it for 15 minutes
  (`login_attempts` table, checked in `authenticate()`).
- **Last-admin protection:** `updateUser()` / `deleteUser()` refuse to
  demote, disable, or delete the last active admin — the portal can never
  lock itself out entirely.
- **Audit trail:** every content change, login attempt, and account action
  writes a row to `audit_log` via `audit()` in `lib/users.ts`. Visible at
  `/admin/audit` (admin only).

---

## 7. Public-surface hardening (Backend Phase 3)

The portal is behind auth, but two things are public: the **contact form**
and, indirectly, **whatever staff upload**. Both get defended:

### Contact form (`app/api/inquiry/route.ts`)
- **Honeypot:** a hidden `website` field that's invisible to humans
  (`components/ContactForm.tsx`) but bots fill it in. If it's non-empty, the
  request is silently accepted but never stored — the bot thinks it worked.
- **Rate limit:** 5 inquiries/hour per IP (`lib/ratelimit.ts`, DB-backed
  fixed window, so it survives restarts and works across multiple server
  processes if you ever scale horizontally).
- **Size cap:** requests over 32 KB are rejected before JSON parsing even
  starts (checked via the `Content-Length` header).
- **Email validation:** regex check before the inquiry is stored.

### Content validation (`lib/validate.ts`)
Every collection write (`POST`/`PUT` on `/api/admin/collections/*`) is
checked against the collection's own schema (`lib/cms/schema.ts`): unknown
locales rejected, unknown fields rejected, values must be
string/string-array/flat-object-array (never arbitrary nested JSON), total
content capped at 200 KB per item. Slugs must match
`^[a-z0-9]+(-[a-z0-9]+)*$`; dates must be `YYYY-MM-DD`.

### Uploads (`app/api/admin/upload/route.ts`)
Extension whitelist (`.jpg/.jpeg/.png/.webp/.avif`) **plus** a magic-byte
check (`sniffImage()`) — the file's actual binary header must match its
claimed type, so a renamed executable can't be stored under an image
extension. 8 MB size cap.

### Email notifications (`lib/mailer.ts`)
Optional. If `SMTP_HOST` isn't set, `notifyInquiry()` is a silent no-op —
inquiries still land in the portal, nothing breaks. If configured (see
`.env.example` for the `SMTP_*` / `INQUIRY_NOTIFY_TO` vars), a new inquiry
sends a plain-text email over the firm's own SMTP account, with
`replyTo` set to the sender — so a partner can hit "reply" directly. This is
fire-and-forget: a mail failure is logged but never fails the inquiry
itself (the correspondence is already safely in the database regardless).

---

## 8. Repository map

```
app/
  [locale]/              public site — /en /am /om, statically prerendered
    page.tsx             home
    origins/ people/ practice/ matters/ presence/ insights/   "chapters"
    discretion/ careers/ contact/ testimonials/
  admin/                  staff portal — force-dynamic, session-gated
    page.tsx              dashboard
    [collection]/          list + editor for testimonials/articles/people/matters
    users/  audit/  site/  inquiries/  login/
  api/
    inquiry/               public — contact form submission
    admin/
      login/ logout/ me/            session lifecycle
      collections/[collection]/     CMS CRUD
      users/                        account management (admin only)
      site/                         hero image + contact details
      inquiries/                    delete
      upload/                       image upload (sniffed)
      stats/                        dashboard counts
  uploads/[name]/          serves files from data/uploads (see note below)

lib/
  content/{en,am,om}.ts    static typed dictionaries (§4a)
  content/types.ts         the Dict interface all three implement
  cms/
    schema.ts              collection field definitions (§4b) — the source of truth
    store.ts                database read/write layer (§5)
    public.ts               read-side for public pages: published-only + locale fallback
    types.ts                 CmsItem, CollectionDef, FieldDef, SiteSettings
  db.ts                    SQLite connection + schema DDL (§5)
  auth.ts                  session token sign/verify — Edge-safe (§6)
  users.ts                 accounts, sessions, audit, rate-limited login (§6) — Node-only
  validate.ts              input validation for the CMS API (§7)
  ratelimit.ts             DB-backed fixed-window rate limiter (§7)
  mailer.ts                inquiry email notifications (§7)
  i18n.ts                  locale list, dictionary lookup, date formatting

components/
  admin/                   portal UI (EditorForm, PortalChrome, UsersManager, …)
  Header.tsx Footer.tsx HomeHero.tsx Timeline.tsx ContactForm.tsx Motifs.tsx

middleware.ts              Edge-safe auth gate over /admin and /api/admin
scripts/backupdb.mjs       online SQLite backup with 14-copy retention
scripts/*check*.mjs        Playwright visual-regression helper scripts
```

**Note on uploads:** files land in `data/uploads/` (not `public/uploads/`)
and are served through `app/uploads/[name]/route.ts`, not Next's static file
serving. This is deliberate — `public/` is snapshotted at `next build` time,
so anything uploaded *after* a build would 404 if served statically. The
custom route handler reads from disk per-request instead.

---

## 9. What's NOT done — for whoever picks this up next

### Proposal Phase 2 / Backend Phase 4 — RAG AI Legal Assistant (not started)

Staff-facing only (no client-facing AI per the signed proposal). Needs,
roughly, in build order:

1. **Document ingestion** — portal screen to upload firm documents
   (PDF/DOCX), extract text, chunk it, generate embeddings (recommend
   Voyage AI, Anthropic's suggested embedding provider), store vectors.
   Given the likely corpus size for a single firm, exact cosine search
   against a table in the existing SQLite database is almost certainly
   sufficient — no need to stand up a dedicated vector database unless the
   document count gets very large.
2. **Retrieval + chat** — a new `/api/admin/assistant` endpoint: embed the
   staff member's question, retrieve top-k chunks, call Claude with the
   retrieved context, stream the answer back with citations to the specific
   source document(s).
3. **Governance** — this is why Backend Phase 2 (roles + audit log) exists
   already: gate the assistant by role, log every query and which documents
   backed the answer, let an admin approve/remove ingested documents.

The existing `users`/`audit_log` tables and role system are intentionally
ready for this — no schema changes needed to start.

### Deployment (not done — "Backend Phase 5" in earlier planning)

- VPS/container setup with a **persistent disk** — this is not optional.
  `data/beka.db` and `data/uploads/` must survive redeploys; a serverless
  or ephemeral-filesystem host (e.g. plain Vercel) will silently lose all
  content and uploads on every deploy. Use a VPS with a mounted volume, or
  a container platform with persistent storage.
- HTTPS termination (Caddy or nginx + Let's Encrypt are both fine).
- Process manager (PM2 or a Docker restart policy) so the Node process
  survives crashes/reboots.
- Wire `scripts/backupdb.mjs` into an actual cron job, and ship backups
  off-box (the current script only writes to a local `backups/` folder).
- Basic uptime/health monitoring.

### Smaller gaps worth knowing about

- **No `sitemap.xml` / `robots.txt` / JSON-LD structured data.** Per-page
  metadata and per-article SEO overrides exist, but site-level SEO plumbing
  doesn't yet. Small addition when someone has a spare afternoon.
- **File-based store needs a persistent disk** (repeated from above because
  it's the single most common way to accidentally lose client data on a
  bad deployment choice).

---

## 10. How to verify your changes actually work

Before assuming a change is correct, run it against the real thing — this
codebase has been through a full manual + automated verification pass and
you should hold new changes to the same bar:

```bash
npm run build          # must compile clean — force-dynamic pages are only
                        # caught at runtime, not build time, so also:
npm run start           # then click through the affected flow for real
```

For anything touching auth, validation, or the database, prefer testing the
actual behavior over trusting the code read-through — e.g. log in as an
`editor` and confirm they genuinely can't reach `/admin/users`, not just
that the code has an `if (role !== "admin")` check. Two examples where this
mattered during our own testing pass:

- A `getDict()` fallback silently rendered English content for *any* locale
  string (`/xx`, `/fr`, …) with a `200` status instead of a proper `404` —
  looked correct in a code read, only showed up when actually visiting the
  URL.
- The public-facing testimonial's admin list row shows its **attribution**
  field, not its **remark** field (`titleField: "attribution"` in
  `lib/cms/schema.ts`) — easy to get wrong if you assume the first/main
  field is always what's displayed.

---

## 11. Environment variables

See `.env.example` for the full list with comments. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Yes (first run only) | Bootstraps the first admin account on an empty `users` table. Irrelevant after that — manage accounts in the portal. |
| `AUTH_SECRET` | Yes | HMAC signing key for session cookies. Any long random string. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` / `INQUIRY_NOTIFY_TO` | No | Enables inquiry email notifications. Leave unset to disable (inquiries still land in the portal). |

---

## 12. Commands

```bash
npm install
npm run dev       # http://localhost:3000, hot reload
npm run build      # static production build — every public route × 3 locales
npm run start       # production server — required for testing force-dynamic
                     #   portal routes and API behavior realistically
node scripts/backupdb.mjs   # manual database backup
```
