import { NextResponse } from "next/server";
import { getSite, saveSite } from "@/lib/cms/store";
import type { SiteSettings } from "@/lib/cms/types";
import { audit, currentUser } from "@/lib/users";
import { isEmail } from "@/lib/validate";

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
  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  if (email && !isEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  const heroImage =
    typeof body.heroImage === "string" && body.heroImage.length > 0 ? body.heroImage : null;
  if (heroImage && !/^\/uploads\/[a-z0-9][a-z0-9.-]*$/i.test(heroImage)) {
    return NextResponse.json({ error: "Hero image must be an uploaded file" }, { status: 400 });
  }
  const settings: SiteSettings = {
    phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 60) : undefined,
    email,
    heroImage,
  };
  saveSite(settings);
  audit(me.username, "site.update");
  return NextResponse.json(settings);
}
