import { NextResponse } from "next/server";
import { getSite, saveSite } from "@/lib/cms/store";
import type { SiteSettings, SocialLink } from "@/lib/cms/types";
import { audit, currentUser } from "@/lib/users";
import { isEmail } from "@/lib/validate";

const UPLOAD_PATH = /^\/uploads\/[a-z0-9][a-z0-9.-]*$/i;
const SOCIAL_PLATFORMS = new Set([
  "linkedin",
  "facebook",
  "x",
  "instagram",
  "telegram",
  "youtube",
  "tiktok",
]);
const HERO_INTERVAL_DEFAULT = 6;
const HERO_INTERVAL_MIN = 2;
const HERO_INTERVAL_MAX = 120;
const MAX_HERO_IMAGES = 8;

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

  // hero images — accept the new list, fall back to the legacy single field
  const rawImages = Array.isArray(body.heroImages)
    ? body.heroImages
    : body.heroImage
      ? [body.heroImage]
      : [];
  const heroImages: string[] = [];
  for (const img of rawImages) {
    if (typeof img !== "string" || img.length === 0) continue;
    if (!UPLOAD_PATH.test(img)) {
      return NextResponse.json({ error: "Hero images must be uploaded files" }, { status: 400 });
    }
    if (!heroImages.includes(img)) heroImages.push(img);
    if (heroImages.length >= MAX_HERO_IMAGES) break;
  }

  let heroIntervalSec = Number(body.heroIntervalSec);
  if (!Number.isFinite(heroIntervalSec)) heroIntervalSec = HERO_INTERVAL_DEFAULT;
  heroIntervalSec = Math.min(HERO_INTERVAL_MAX, Math.max(HERO_INTERVAL_MIN, Math.round(heroIntervalSec)));

  // social links
  const social: SocialLink[] = [];
  if (Array.isArray(body.social)) {
    for (const s of body.social) {
      if (!s || typeof s.platform !== "string" || typeof s.url !== "string") continue;
      const platform = s.platform.trim().toLowerCase();
      const url = s.url.trim();
      if (!url) continue;
      if (!SOCIAL_PLATFORMS.has(platform)) {
        return NextResponse.json({ error: `Unsupported platform “${s.platform}”` }, { status: 400 });
      }
      if (!/^https:\/\/[^\s]+\.[^\s]+$/i.test(url) || url.length > 300) {
        return NextResponse.json({ error: `“${url}” is not a valid https URL` }, { status: 400 });
      }
      social.push({ platform, url });
    }
  }

  const settings: SiteSettings = {
    phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 60) : undefined,
    email,
    heroImages,
    // keep the legacy field in sync so any old reader still works
    heroImage: heroImages[0] ?? null,
    heroIntervalSec,
    social,
  };
  saveSite(settings);
  audit(me.username, "site.update");
  return NextResponse.json(settings);
}
