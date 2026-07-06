import { NextResponse } from "next/server";
import { getSite, saveSite } from "@/lib/cms/store";
import type { SiteSettings } from "@/lib/cms/types";

export async function GET() {
  return NextResponse.json(getSite());
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as SiteSettings | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const settings: SiteSettings = {
    phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
    email: typeof body.email === "string" ? body.email.trim() : undefined,
    heroImage: typeof body.heroImage === "string" && body.heroImage.length > 0 ? body.heroImage : null,
  };
  saveSite(settings);
  return NextResponse.json(settings);
}
