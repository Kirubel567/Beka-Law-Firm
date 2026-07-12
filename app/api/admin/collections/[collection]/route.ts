import { NextResponse } from "next/server";
import { getCollection } from "@/lib/cms/schema";
import { listItems, upsertItem } from "@/lib/cms/store";
import type { CmsItem } from "@/lib/cms/types";
import { audit, currentUser } from "@/lib/users";
import { cleanLocales, isIsoDate, isSlug } from "@/lib/validate";

type Params = { params: Promise<{ collection: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await currentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { collection } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }
  return NextResponse.json(listItems(collection));
}

export async function POST(req: Request, { params }: Params) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection } = await params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
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
  const locales = cleanLocales(body.locales, def);
  if ("error" in locales) {
    return NextResponse.json(locales, { status: 400 });
  }
  const item: CmsItem = {
    id: body.id && body.id.length > 0 ? body.id : crypto.randomUUID(),
    status: body.status === "published" ? "published" : "draft",
    order: typeof body.order === "number" ? body.order : listItems(collection).length + 1,
    slug: body.slug,
    date: body.date,
    image: typeof body.image === "string" && body.image.length > 0 ? body.image : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locales,
  };
  const stored = upsertItem(collection, item);
  audit(me.username, "item.create", { collection, itemId: stored.id });
  return NextResponse.json(stored);
}
