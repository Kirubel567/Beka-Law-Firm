import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/cms/schema";
import { listItems } from "@/lib/cms/store";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

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
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="label-caps text-parchment-200/50 hover:text-brass-300">
            ← Content
          </Link>
          <h1 className="mt-2 font-display text-3xl font-medium text-parchment-50">{def.label}</h1>
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
          return (
            <div key={item.id} className="flex items-center gap-5 px-6 py-4">
              <span
                className={`label-caps w-24 shrink-0 ${
                  item.status === "published" ? "text-brass-300" : "text-parchment-200/40"
                }`}
              >
                {item.status}
              </span>
              <Link
                href={`/admin/${collection}/${item.id}`}
                className="min-w-0 flex-1 truncate text-parchment-100 transition-colors hover:text-brass-300"
              >
                {enTitle}
              </Link>
              {def.hasDate && item.date && (
                <span className="hidden text-xs text-parchment-200/40 md:block">{item.date}</span>
              )}
              {def.hasSlug && item.slug && (
                <span className="hidden text-xs text-parchment-200/40 lg:block">/{item.slug}</span>
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
    </>
  );
}
