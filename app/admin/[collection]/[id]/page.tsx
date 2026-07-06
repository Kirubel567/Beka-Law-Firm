import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/cms/schema";
import { getItem } from "@/lib/cms/store";
import EditorForm from "@/components/admin/EditorForm";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection, id } = await params;
  const def = getCollection(collection);
  if (!def) notFound();

  const item = id === "new" ? null : getItem(collection, id);
  if (id !== "new" && !item) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/admin/${collection}`} className="label-caps text-parchment-200/50 hover:text-brass-300">
        ← {def.label}
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-parchment-50">
        {item ? "Edit entry" : "New entry"}
      </h1>
      <EditorForm def={def} item={item ?? null} />
    </div>
  );
}
