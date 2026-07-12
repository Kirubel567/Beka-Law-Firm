import { NextResponse } from "next/server";
import { getCollection } from "@/lib/cms/schema";
import { deleteItem, getItem, upsertItem } from "@/lib/cms/store";
import type { CmsItem } from "@/lib/cms/types";
import { audit, currentUser } from "@/lib/users";
import { cleanLocales, isIsoDate, isSlug } from "@/lib/validate";

type Params = { params: Promise<{ collection: string; id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection, id } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }
  const existing = getItem(collection, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await req.json().catch(() => null)) as Partial<CmsItem> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const def = getCollection(collection)!;
  if (typeof body.slug === "string" && body.slug.length > 0 && !isSlug(body.slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase letters, digits and hyphens" },
      { status: 400 },
    );
  }
  if (typeof body.date === "string" && body.date.length > 0 && !isIsoDate(body.date)) {
    return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });
  }
  let locales = existing.locales;
  if (body.locales !== undefined) {
    const cleaned = cleanLocales(body.locales, def);
    if ("error" in cleaned) {
      return NextResponse.json(cleaned, { status: 400 });
    }
    locales = cleaned;
  }
  const item: CmsItem = {
    ...existing,
    status: body.status === "published" ? "published" : "draft",
    order: typeof body.order === "number" ? body.order : existing.order,
    slug: body.slug ?? existing.slug,
    date: body.date ?? existing.date,
    image:
      body.image === undefined
        ? existing.image
        : typeof body.image === "string" && body.image.length > 0
          ? body.image
          : null,
    locales,
  };
  const stored = upsertItem(collection, item);
  audit(me.username, "item.update", { collection, itemId: id });
  return NextResponse.json(stored);
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection, id } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }
  const ok = deleteItem(collection, id);
  if (ok) audit(me.username, "item.delete", { collection, itemId: id });
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
