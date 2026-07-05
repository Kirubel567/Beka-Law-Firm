import { NextResponse } from "next/server";
import { getCollection } from "@/lib/cms/schema";
import { listItems, upsertItem } from "@/lib/cms/store";
import type { CmsItem } from "@/lib/cms/types";

type Params = { params: Promise<{ collection: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { collection } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }
  return NextResponse.json(listItems(collection));
}

export async function POST(req: Request, { params }: Params) {
  const { collection } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }
  const body = (await req.json().catch(() => null)) as Partial<CmsItem> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const item: CmsItem = {
    id: body.id && body.id.length > 0 ? body.id : crypto.randomUUID(),
    status: body.status === "published" ? "published" : "draft",
    order: typeof body.order === "number" ? body.order : listItems(collection).length + 1,
    slug: body.slug,
    date: body.date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locales: body.locales ?? {},
  };
  return NextResponse.json(upsertItem(collection, item));
}
