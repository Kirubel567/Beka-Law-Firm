import { NextResponse } from "next/server";
import { getSite, saveSite } from "@/lib/cms/store";
import type { SiteSettings } from "@/lib/cms/types";
import { audit, currentUser } from "@/lib/users";

export async function GET() {
  if (!(await currentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getSite());
}

export async function PUT(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as SiteSettings | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const settings: SiteSettings = {
    phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
    email: typeof body.email === "string" ? body.email.trim() : undefined,
    heroImage: typeof body.heroImage === "string" && body.heroImage.length > 0 ? body.heroImage : null,
  };
  saveSite(settings);
  audit(me.username, "site.update");
  return NextResponse.json(settings);
}
