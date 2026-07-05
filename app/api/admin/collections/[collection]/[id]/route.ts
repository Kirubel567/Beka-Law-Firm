import { NextResponse } from "next/server";
import { getCollection } from "@/lib/cms/schema";
import { deleteItem, getItem, upsertItem } from "@/lib/cms/store";
import type { CmsItem } from "@/lib/cms/types";

type Params = { params: Promise<{ collection: string; id: string }> };

export async function PUT(req: Request, { params }: Params) {
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
  const item: CmsItem = {
    ...existing,
    status: body.status === "published" ? "published" : "draft",
    order: typeof body.order === "number" ? body.order : existing.order,
    slug: body.slug ?? existing.slug,
    date: body.date ?? existing.date,
    locales: body.locales ?? existing.locales,
  };
  return NextResponse.json(upsertItem(collection, item));
}

export async function DELETE(_req: Request, { params }: Params) {
  const { collection, id } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }
  const ok = deleteItem(collection, id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
