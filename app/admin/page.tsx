import Link from "next/link";
import { collections } from "@/lib/cms/schema";
import { getSite, listInquiries, listItems } from "@/lib/cms/store";
import type { CmsItem } from "@/lib/cms/types";
import {
  IconArticle,
  IconInbox,
  IconMatter,
  IconPerson,
  IconPlus,
  IconQuote,
  IconSettings,
} from "@/components/admin/icons";

export const dynamic = "force-dynamic";

function hasLocaleContent(item: CmsItem, locale: "am" | "om", titleField: string): boolean {
  const loc = item.locales[locale] as Record<string, unknown> | undefined;
  const v = loc?.[titleField];
  return typeof v === "string" && v.trim() !== "";
}

const icons: Record<string, typeof IconArticle> = {
  articles: IconArticle,
  people: IconPerson,
  matters: IconMatter,
  testimonials: IconQuote,
};

export default function AdminDashboard() {
  const site = getSite();
  const inquiries = listInquiries();

  const all = collections.map((def) => ({ def, items: listItems(def.slug) }));
  const published = all.reduce((n, c) => n + c.items.filter((i) => i.status === "published").length, 0);
  const drafts = all.reduce((n, c) => n + c.items.filter((i) => i.status === "draft").length, 0);

  // entries that still need work — drafts or missing translations
  const attention = all
    .flatMap(({ def, items }) =>
      items
        .map((item) => {
          const flags: string[] = [];
          if (item.status === "draft") flags.push("draft");
          if (!hasLocaleContent(item, "am", def.titleField)) flags.push("no አማርኛ");
          if (!hasLocaleContent(item, "om", def.titleField)) flags.push("no Oromoo");
          return { def, item, flags };
        })
        .filter((x) => x.flags.length > 0),
    )
    .slice(0, 8);

  const quickActions = [
    { href: "/admin/articles/new", label: "New article", hint: "An insight note, in three languages", Icon: IconArticle },
    { href: "/admin/testimonials/new", label: "New testimonial", hint: "A consented remark, without a name", Icon: IconQuote },
    { href: "/admin/people/new", label: "New profile", hint: "A custodian, with portrait", Icon: IconPerson },
    { href: "/admin/matters/new", label: "New matter", hint: "The substance, not the fingerprints", Icon: IconMatter },
  ];

  const stats = [
    { label: "Published", value: String(published), sub: "live on the site" },
    { label: "Drafts", value: String(drafts), sub: "visible only here" },
    { label: "Inquiries", value: String(inquiries.length), sub: "awaiting a partner" },
    { label: "Languages", value: "3", sub: "English · አማርኛ · Oromoo" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* ——— hero panel ——— */}
      <section className="border border-(--p-border) bg-(--p-panel) p-8 md:p-10">
        <p className="label-caps text-(--p-accent)">Belay Ketema &amp; Partners · Staff Portal</p>
        <h2 className="mt-4 font-display text-4xl font-medium text-(--p-text) md:text-5xl">
          The chronicle, kept current.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-(--p-text-3)">
          Everything on the public website is managed from here — in English, Amharic
          and Afaan Oromoo, with a draft → publish workflow. What you publish is live
          the moment you publish it.
        </p>

        <div className="mt-8 grid gap-px border border-(--p-border) bg-(--p-border) sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ href, label, hint, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group bg-(--p-panel) p-5 transition-colors hover:bg-(--p-hover)"
            >
              <span className="flex items-center gap-2 text-(--p-accent)">
                <Icon className="h-4 w-4" />
                <IconPlus className="h-3 w-3 opacity-60" />
              </span>
              <span className="label-caps mt-3 block text-(--p-text) group-hover:text-(--p-accent)">
                {label}
              </span>
              <span className="mt-1.5 block text-xs leading-snug text-(--p-text-4)">{hint}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ——— stat strip ——— */}
      <section className="grid grid-cols-2 gap-px border-x border-b border-(--p-border) bg-(--p-border) lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-(--p-bg) px-6 py-5">
            <p className="label-caps text-[0.6rem] text-(--p-text-4)">{s.label}</p>
            <p className="mt-2 font-display text-3xl text-(--p-text) tabular-nums">{s.value}</p>
            <p className="mt-1 text-[0.68rem] text-(--p-text-4)">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* ——— 01 · needs attention ——— */}
      <section className="mt-12">
        <div className="flex items-baseline gap-4">
          <span className="label-caps text-(--p-accent-2)">01 · Needs attention</span>
          <span className="h-px flex-1 bg-(--p-border)" aria-hidden="true" />
        </div>
        {attention.length === 0 ? (
          <p className="mt-5 text-sm text-(--p-text-3)">
            Nothing waiting — every entry is published in all three languages.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-(--p-border) border border-(--p-border) bg-(--p-panel)">
            {attention.map(({ def, item, flags }) => {
              const title = String(
                (item.locales.en as Record<string, unknown> | undefined)?.[def.titleField] ?? "(untitled)",
              );
              return (
                <Link
                  key={item.id}
                  href={`/admin/${def.slug}/${item.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5"
                >
                  <span className="label-caps w-32 shrink-0 text-[0.6rem] text-(--p-text-4)">
                    {def.label.split(" /")[0]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-(--p-text) transition-colors group-hover:text-(--p-accent)">
                    {title}
                  </span>
                  <span className="flex shrink-0 gap-2">
                    {flags.map((f) => (
                      <span
                        key={f}
                        className={`label-caps border px-2 py-0.5 text-[0.55rem] ${
                          f === "draft"
                            ? "border-(--p-alert) text-(--p-alert)"
                            : "border-(--p-border-2) text-(--p-text-3)"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ——— 02 · latest inquiries ——— */}
      <section className="mt-12">
        <div className="flex items-baseline gap-4">
          <span className="label-caps text-(--p-accent-2)">02 · Latest inquiries</span>
          <span className="h-px flex-1 bg-(--p-border)" aria-hidden="true" />
          <Link href="/admin/inquiries" className="label-caps text-(--p-text-3) hover:text-(--p-accent)">
            All →
          </Link>
        </div>
        {inquiries.length === 0 ? (
          <p className="mt-5 text-sm text-(--p-text-3)">The inbox is quiet.</p>
        ) : (
          <div className="mt-5 grid gap-px border border-(--p-border) bg-(--p-border) md:grid-cols-3">
            {inquiries.slice(0, 3).map((q) => (
              <Link key={q.id} href="/admin/inquiries" className="group bg-(--p-panel) p-5 transition-colors hover:bg-(--p-hover)">
                <span className="flex items-center gap-2 text-(--p-accent-2)">
                  <IconInbox className="h-4 w-4" />
                  <span className="label-caps text-[0.55rem]">{new Date(q.createdAt).toLocaleDateString("en-GB")}</span>
                </span>
                <span className="mt-3 block truncate text-sm text-(--p-text) group-hover:text-(--p-accent)">
                  {q.name}
                </span>
                <span className="mt-1 block truncate text-xs text-(--p-text-4)">
                  {q.matter || "Unspecified matter"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ——— 03 · collections & site ——— */}
      <section className="mt-12 mb-4">
        <div className="flex items-baseline gap-4">
          <span className="label-caps text-(--p-accent-2)">03 · Collections</span>
          <span className="h-px flex-1 bg-(--p-border)" aria-hidden="true" />
        </div>
        <div className="mt-5 grid gap-px border border-(--p-border) bg-(--p-border) sm:grid-cols-2">
          {all.map(({ def, items }) => {
            const Icon = icons[def.slug] ?? IconArticle;
            const d = items.filter((i) => i.status === "draft").length;
            return (
              <Link key={def.slug} href={`/admin/${def.slug}`} className="group bg-(--p-panel) p-6 transition-colors hover:bg-(--p-hover)">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-(--p-accent-2)" />
                    <span className="font-display text-xl text-(--p-text) group-hover:text-(--p-accent)">{def.label}</span>
                  </span>
                  <span className="label-caps text-[0.6rem] text-(--p-text-4) tabular-nums">
                    {items.length}{d > 0 ? ` · ${d} draft${d > 1 ? "s" : ""}` : ""}
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-(--p-text-3)">{def.description}</p>
              </Link>
            );
          })}
          <Link href="/admin/site" className="group bg-(--p-panel) p-6 transition-colors hover:bg-(--p-hover) sm:col-span-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2.5">
                <IconSettings className="h-4 w-4 text-(--p-accent-2)" />
                <span className="font-display text-xl text-(--p-text) group-hover:text-(--p-accent)">Site settings</span>
              </span>
              <span className="label-caps text-[0.6rem] text-(--p-text-4)">
                {site.heroImage ? "hero image set" : "no hero image"}
              </span>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-(--p-text-3)">
              Hero image, telephone and email — the details that must never be placeholders.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
