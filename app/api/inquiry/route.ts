import { NextResponse } from "next/server";
import { addInquiry } from "@/lib/cms/store";

/**
 * Public endpoint for the consultation form. Inquiries land in the staff
 * portal only — nothing is sent to third parties.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const name = str(body.name, 200);
  const email = str(body.email, 200);
  const message = str(body.message, 4000);
  // honeypot — bots fill every field; humans never see this one
  if (str(body.website, 10) !== "") return NextResponse.json({ ok: true });

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  addInquiry({
    name,
    email,
    message,
    organization: str(body.organization, 300),
    language: str(body.language, 40),
    matter: str(body.matter, 120),
  });

  return NextResponse.json({ ok: true });
}
