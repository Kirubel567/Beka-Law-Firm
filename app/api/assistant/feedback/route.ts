import { NextResponse } from "next/server";
import { ragFetch } from "@/lib/assistant/server";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!rateLimit(`assistant:feedback:${clientKey(req)}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Feedback limit reached" }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as {
    response_id?: string;
    session_id?: string;
    rating?: number;
  } | null;
  if (
    !body ||
    typeof body.response_id !== "string" ||
    body.response_id.length < 16 ||
    typeof body.session_id !== "string" ||
    body.session_id.length < 16 ||
    (body.rating !== 1 && body.rating !== -1)
  ) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }
  try {
    const upstream = await ragFetch("/internal/assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!upstream.ok) return NextResponse.json({ error: "Feedback was not saved" }, { status: 502 });
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Feedback was not saved" }, { status: 503 });
  }
}
