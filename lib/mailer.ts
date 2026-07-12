import nodemailer from "nodemailer";
import type { Inquiry } from "@/lib/cms/store";

/**
 * Inquiry notifications over the firm's own SMTP account — no third-party
 * mail API, so client correspondence never leaves infrastructure the firm
 * controls. Configured entirely through env; when SMTP_HOST is unset the
 * mailer is a silent no-op (inquiries still land in the portal).
 */

let warned = false;

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (!warned) {
      warned = true;
      console.log("[mailer] SMTP_HOST not set — inquiry emails disabled");
    }
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });
}

/** Fire-and-forget: a mail failure must never fail the inquiry itself. */
export function notifyInquiry(q: Inquiry): void {
  const t = transport();
  const to = process.env.INQUIRY_NOTIFY_TO;
  if (!t || !to) return;

  const lines = [
    `Name:         ${q.name}`,
    q.organization && `Organization: ${q.organization}`,
    `Email:        ${q.email}`,
    q.matter && `Matter:       ${q.matter}`,
    q.language && `Reply in:     ${q.language}`,
    "",
    q.message,
    "",
    "—",
    "Received by the BEKA staff portal. Reply goes to the sender, not to this address.",
  ].filter((l): l is string => l !== "");

  t.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    replyTo: q.email,
    subject: `New consultation inquiry — ${q.name}${q.matter ? ` (${q.matter})` : ""}`,
    text: lines.join("\n"),
  }).catch((err: unknown) => {
    console.error("[mailer] inquiry notification failed:", (err as Error).message);
  });
}
