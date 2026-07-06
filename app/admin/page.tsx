import Link from "next/link";
import { collections } from "@/lib/cms/schema";
import { getSite, listInquiries, listItems } from "@/lib/cms/store";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const site = getSite();
  const inquiries = listInquiries();
  return (
    <>
      <h1 className="font-display text-3xl font-medium text-parchment-50">Content</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parchment-200/60">
        Everything on the public website is managed here — in English, Amharic and
        Afaan Oromoo, with a draft → publish workflow. Changes appear on the site
        the moment they are published.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {collections.map((c) => {
          const items = listItems(c.slug);
          const drafts = items.filter((i) => i.status === "draft").length;
          return (
            <Link
              key={c.slug}
              href={`/admin/${c.slug}`}
              className="group border border-parchment-100/10 bg-basalt-900 p-7 transition-colors hover:border-brass-500/50"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-medium text-parchment-100 group-hover:text-brass-300">
                  {c.label}
                </h2>
                <span className="label-caps text-parchment-200/50">
                  {items.length} {drafts > 0 ? `· ${drafts} draft${drafts > 1 ? "s" : ""}` : ""}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-parchment-200/60">{c.description}</p>
            </Link>
          );
        })}

        <Link
          href="/admin/inquiries"
          className="group border border-parchment-100/10 bg-basalt-900 p-7 transition-colors hover:border-brass-500/50"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-medium text-parchment-100 group-hover:text-brass-300">
              Inquiries
            </h2>
            <span className="label-caps text-parchment-200/50">{inquiries.length}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-parchment-200/60">
            Consultation requests from the public site — confidential correspondence,
            read by a partner.
          </p>
        </Link>

        <Link
          href="/admin/site"
          className="group border border-parchment-100/10 bg-basalt-900 p-7 transition-colors hover:border-brass-500/50"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-medium text-parchment-100 group-hover:text-brass-300">
              Site settings
            </h2>
            <span className="label-caps text-parchment-200/50">
              {site.heroImage ? "hero image set" : "no hero image"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-parchment-200/60">
            Hero image, telephone and email — the details that must never be placeholders.
          </p>
        </Link>
      </div>
    </>
  );
}
