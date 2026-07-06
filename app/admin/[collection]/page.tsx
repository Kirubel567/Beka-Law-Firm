import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/cms/schema";
import { listItems } from "@/lib/cms/store";
import type { CmsItem } from "@/lib/cms/types";
import DeleteButton from "@/components/admin/DeleteButton";
import { IconPerson } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

function localeChip(item: CmsItem, locale: "am" | "om", titleField: string): boolean {
  const loc = item.locales[locale] as Record<string, unknown> | undefined;
  const v = loc?.[titleField];
  return typeof v === "string" && v.trim() !== "";
}

export default async function CollectionListPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const def = getCollection(collection);
  if (!def) notFound();

  const items = listItems(collection);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-parchment-50">{def.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-parchment-200/60">{def.description}</p>
        </div>
        <Link
          href={`/admin/${collection}/new`}
          className="border border-brass-500/70 px-5 py-3 text-[0.7rem] tracking-[0.2em] text-brass-300 uppercase transition-colors hover:bg-brass-400/10"
        >
          + New entry
        </Link>
      </div>

      <div className="mt-8 divide-y divide-parchment-100/10 border border-parchment-100/10 bg-basalt-900">
        {items.length === 0 && (
          <p className="p-8 text-sm text-parchment-200/50">Nothing here yet.</p>
        )}
        {items.map((item) => {
          const enTitle = String(
            (item.locales.en as Record<string, unknown> | undefined)?.[def.titleField] ?? "(untitled)",
          );
          const am = localeChip(item, "am", def.titleField);
          const om = localeChip(item, "om", def.titleField);
          return (
            <div key={item.id} className="flex items-center gap-5 px-5 py-3.5">
              {def.hasImage &&
                (item.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image}
                    alt=""
                    className="h-12 w-10 shrink-0 border border-parchment-100/15 object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-10 shrink-0 items-center justify-center border border-dashed border-parchment-100/15 text-parchment-200/25">
                    <IconPerson className="h-4 w-4" />
                  </span>
                ))}
              <span
                className={`label-caps w-20 shrink-0 text-[0.6rem] ${
                  item.status === "published" ? "text-brass-300" : "text-terracotta-500"
                }`}
              >
                {item.status}
              </span>
              <Link
                href={`/admin/${collection}/${item.id}`}
                className="min-w-0 flex-1 truncate text-sm text-parchment-100 transition-colors hover:text-brass-300"
              >
                {enTitle}
              </Link>
              {/* translation coverage — the trilingual promise, visible at a glance */}
              <span className="hidden shrink-0 gap-1.5 sm:flex" aria-label="Translations">
                <span className="label-caps border border-parchment-100/20 px-1.5 py-0.5 text-[0.5rem] text-parchment-200/60">EN</span>
                <span className={`label-caps border px-1.5 py-0.5 text-[0.5rem] ${am ? "border-parchment-100/20 text-parchment-200/60" : "border-terracotta-500/40 text-terracotta-500/80"}`}>አማ</span>
                <span className={`label-caps border px-1.5 py-0.5 text-[0.5rem] ${om ? "border-parchment-100/20 text-parchment-200/60" : "border-terracotta-500/40 text-terracotta-500/80"}`}>OR</span>
              </span>
              {def.hasDate && item.date && (
                <span className="hidden text-xs text-parchment-200/40 md:block">{item.date}</span>
              )}
              {def.hasSlug && item.slug && (
                <span className="hidden max-w-40 truncate text-xs text-parchment-200/40 lg:block">/{item.slug}</span>
              )}
              <Link
                href={`/admin/${collection}/${item.id}`}
                className="label-caps text-parchment-200/60 hover:text-brass-300"
              >
                Edit
              </Link>
              <DeleteButton collection={collection} id={item.id} />
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-parchment-200/35">
        አማ / OR chips show which entries still need their Amharic or Oromo translation.
      </p>
    </div>
  );
}
