import { NextResponse } from "next/server";
import { addInquiry } from "@/lib/cms/store";
import { notifyInquiry } from "@/lib/mailer";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { isEmail } from "@/lib/validate";

/**
 * Public endpoint for the consultation form. Inquiries land in the staff
 * portal (and, when SMTP is configured, in the firm's inbox) — nothing is
 * sent to third parties.
 */
export async function POST(req: Request) {
  // spam defense 1: a sender can file at most 5 inquiries per hour
  if (!rateLimit(`inquiry:${clientKey(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many inquiries — please try again later" },
      { status: 429 },
    );
  }

  // oversized payloads never reach JSON parsing
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 32 * 1024) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const name = str(body.name, 200);
  const email = str(body.email, 200);
  const message = str(body.message, 4000);
  // spam defense 2: honeypot — bots fill every field; humans never see this one
  if (str(body.website, 10) !== "") return NextResponse.json({ ok: true });

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const stored = addInquiry({
    name,
    email,
    message,
    organization: str(body.organization, 300),
    language: str(body.language, 40),
    matter: str(body.matter, 120),
  });
  notifyInquiry(stored); // fire-and-forget: mail failure never fails the inquiry

  return NextResponse.json({ ok: true });
}
