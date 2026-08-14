import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { ragFetch } from "@/lib/assistant/server";
import type { AssistantHistoryMessage, AssistantRequestBody } from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_REQUESTS = 20;
const WINDOW_MS = 10 * 60 * 1000;

const localFallback = {
  en: "You can explore BEKA's Practice Areas, People, Case Studies, and Insights from the main navigation. For advice about a specific matter, use Contact the firm; a partner reviews every inquiry. This assistant provides general information only and does not give legal advice.",
  am: "የበካን የሥራ መስኮች፣ ባለሙያዎች፣ የጉዳይ ጥናቶች እና ማስታወሻዎች ከዋናው ማውጫ ማሰስ ይችላሉ። ስለተወሰነ ጉዳይ ምክር ለማግኘት “ድርጅቱን ያነጋግሩ” የሚለውን ይጠቀሙ፤ እያንዳንዱን ጥያቄ አጋር ይመለከታል። ይህ ረዳት አጠቃላይ መረጃ ብቻ ይሰጣል፤ የሕግ ምክር አይሰጥም።",
  om: "Dameewwan Hojii, Namoota, Qo'annoo Dhimmootaa fi Yaadannoo BEKA baafata ijoo irraa ilaalu dandeessu. Dhimma addaa irratti gorsa argachuuf ‘Dhaabbaticha qunnami’ fayyadami; gaaffii hunda michuun ilaala. Gargaaraan kun odeeffannoo waliigalaa qofa kenna; gorsa seeraa miti.",
} as const;

function fallbackResponse(locale: keyof typeof localFallback): Response {
  const body = `event: token\ndata: ${JSON.stringify({ text: localFallback[locale] })}\n\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-Beka-Assistant-Mode": "local-fallback",
    },
  });
}

function validHistory(value: unknown): value is AssistantHistoryMessage[] {
  return (
    Array.isArray(value) &&
    value.length <= 6 &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        ((item as AssistantHistoryMessage).role === "user" ||
          (item as AssistantHistoryMessage).role === "assistant") &&
        typeof (item as AssistantHistoryMessage).content === "string" &&
        (item as AssistantHistoryMessage).content.trim().length > 0 &&
        (item as AssistantHistoryMessage).content.length <= 2000,
    )
  );
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }
  const body = (await req.json().catch(() => null)) as Partial<AssistantRequestBody> | null;
  if (
    !body ||
    typeof body.message !== "string" ||
    body.message.trim().length < 2 ||
    body.message.length > 2000 ||
    typeof body.locale !== "string" ||
    !isLocale(body.locale) ||
    typeof body.session_id !== "string" ||
    body.session_id.length < 16 ||
    body.session_id.length > 128 ||
    !validHistory(body.history)
  ) {
    return NextResponse.json({ error: "Invalid assistant request" }, { status: 400 });
  }
  const key = clientKey(req);
  if (!rateLimit(`assistant:ip:${key}`, MAX_REQUESTS, WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many questions. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }
  if (!rateLimit(`assistant:session:${body.session_id}`, MAX_REQUESTS, WINDOW_MS)) {
    return NextResponse.json(
      { error: "This conversation has reached its temporary limit." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }
  try {
    const upstream = await ragFetch("/internal/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        message: body.message.trim(),
        locale: body.locale,
        session_id: body.session_id,
        history: body.history,
      }),
    });
    if (!upstream.ok || !upstream.body) {
      console.error("RAG assistant upstream failed", upstream.status);
      return fallbackResponse(body.locale);
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("RAG assistant gateway error", error instanceof Error ? error.message : error);
    return fallbackResponse(body.locale);
  }
}
