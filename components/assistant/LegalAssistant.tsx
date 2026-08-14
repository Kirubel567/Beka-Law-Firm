"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/content/types";
import type { AssistantCitation, AssistantHistoryMessage } from "@/lib/assistant/types";

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations: AssistantCitation[];
  responseId?: string;
  failed?: boolean;
  rated?: 1 | -1;
}

const copy = {
  en: {
    launcher: "Ask Beka",
    title: "Legal Information Assistant",
    subtitle: "Website guidance and approved public legal information",
    close: "Close assistant",
    notice: "AI-generated general information. Not legal advice. Do not submit confidential information.",
    placeholder: "Ask about the firm, its services, or a published legal topic…",
    send: "Send",
    sending: "Reviewing approved sources…",
    welcome: "How can I help you explore Beka Law Firm or its published legal information?",
    prompts: ["Explore our services", "Find the right practice area", "Ask about a published legal topic"],
    sources: "Sources",
    error: "I could not complete that request. Please try again.",
    contact: "Contact the firm",
    helpful: "Helpful",
    notHelpful: "Not helpful",
  },
  am: {
    launcher: "በካን ይጠይቁ",
    title: "የሕግ መረጃ ረዳት",
    subtitle: "የድረ-ገጽ መመሪያ እና የተፈቀደ የሕዝብ የሕግ መረጃ",
    close: "ረዳቱን ዝጋ",
    notice: "በAI የተዘጋጀ አጠቃላይ መረጃ ነው። የሕግ ምክር አይደለም። ምስጢራዊ መረጃ አያስገቡ።",
    placeholder: "ስለ ድርጅቱ፣ አገልግሎቶቹ ወይም የታተመ የሕግ ርዕስ ይጠይቁ…",
    send: "ላክ",
    sending: "የተፈቀዱ ምንጮችን በመመልከት ላይ…",
    welcome: "ስለ በካ የሕግ ድርጅት ወይም ስለታተመው የሕግ መረጃ ምን ልርዳዎት?",
    prompts: ["አገልግሎቶቻችንን ይመልከቱ", "ተገቢውን የሥራ መስክ ያግኙ", "ስለታተመ የሕግ ርዕስ ይጠይቁ"],
    sources: "ምንጮች",
    error: "ጥያቄውን ማጠናቀቅ አልቻልኩም። እንደገና ይሞክሩ።",
    contact: "ድርጅቱን ያነጋግሩ",
    helpful: "ጠቃሚ",
    notHelpful: "ጠቃሚ አይደለም",
  },
  om: {
    launcher: "BEKA gaafadhu",
    title: "Gargaaraa Odeeffannoo Seeraa",
    subtitle: "Qajeelfama marsariitii fi odeeffannoo seeraa uummataa raggaasifame",
    close: "Gargaaraa cufi",
    notice: "Odeeffannoo waliigalaa AI'n qophaa'e. Gorsa seeraa miti. Odeeffannoo iccitii hin galchinaa.",
    placeholder: "Waa'ee dhaabbatichaa, tajaajila isaa ykn mata-duree seeraa maxxanfame gaafadhu…",
    send: "Ergi",
    sending: "Madda raggaasifame ilaalaa jira…",
    welcome: "Dhaabbata Seeraa BEKA ykn odeeffannoo seeraa inni maxxanse akkamitti akka qorattan isin gargaaruu?",
    prompts: ["Tajaajila keenya ilaali", "Damee hojii sirrii argadhu", "Mata-duree seeraa maxxanfame gaafadhu"],
    sources: "Maddoota",
    error: "Gaaffii kana xumuruu hin dandeenye. Maaloo irra deebi'ii yaali.",
    contact: "Dhaabbaticha qunnami",
    helpful: "Gargaaraa",
    notHelpful: "Hin gargaarre",
  },
} as const;

function eventParts(block: string): { event: string; data: unknown } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

function newSessionId(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

export default function LegalAssistant({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let id = "";
    try {
      id = localStorage.getItem("beka-assistant-session") ?? "";
      if (id.length < 16) {
        id = newSessionId();
        localStorage.setItem("beka-assistant-session", id);
      }
    } catch {
      id = newSessionId();
    }
    setSessionId(id);
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updateAssistant = (id: string, update: (message: UiMessage) => UiMessage) => {
    setMessages((current) => current.map((message) => (message.id === id ? update(message) : message)));
  };

  const submit = async (question = input) => {
    const trimmed = question.trim();
    if (!trimmed || busy || !sessionId) return;
    const assistantId = crypto.randomUUID();
    const history: AssistantHistoryMessage[] = messages.slice(-6).map((message) => ({
      role: message.role,
      content: message.text,
    }));
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: trimmed, citations: [] },
      { id: assistantId, role: "assistant", text: "", citations: [] },
    ]);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message: trimmed, locale, session_id: sessionId, history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? t.error);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const parsed = eventParts(block);
          if (parsed?.event === "metadata") {
            const data = parsed.data as { response_id?: string };
            if (data.response_id) {
              updateAssistant(assistantId, (message) => ({ ...message, responseId: data.response_id }));
            }
          } else if (parsed?.event === "token") {
            const data = parsed.data as { text?: string };
            if (data.text) {
              updateAssistant(assistantId, (message) => ({ ...message, text: message.text + data.text }));
            }
          } else if (parsed?.event === "citation") {
            const citation = parsed.data as AssistantCitation;
            updateAssistant(assistantId, (message) => ({
              ...message,
              citations: [...message.citations, citation],
            }));
          } else if (parsed?.event === "error") {
            const data = parsed.data as { message?: string };
            throw new Error(data.message ?? t.error);
          }
          boundary = buffer.indexOf("\n\n");
        }
        if (done) break;
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        updateAssistant(assistantId, (message) => ({
          ...message,
          text: message.text || (error instanceof Error ? error.message : t.error),
          failed: true,
        }));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const rate = async (messageId: string, responseId: string, rating: 1 | -1) => {
    updateAssistant(messageId, (message) => ({ ...message, rated: rating }));
    await fetch("/api/assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_id: responseId, session_id: sessionId, rating }),
    }).catch(() => {});
  };

  return (
    <div className="fixed right-4 bottom-4 z-[35] md:right-7 md:bottom-7" lang={locale}>
      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="mb-3 flex h-[min(650px,calc(100svh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-sm border border-(--assistant-border) bg-(--assistant-paper) text-(--assistant-ink) shadow-[0_24px_70px_rgba(20,17,18,0.24)]"
        >
          <header className="flex items-start justify-between gap-4 border-t-2 border-t-crimson-500 border-b border-parchment-100/12 bg-basalt-950 px-5 py-4 text-parchment-100">
            <div>
              <p className="font-display text-xl font-medium">{t.title}</p>
              <p className="mt-1 text-[0.72rem] leading-snug text-parchment-200/78">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-parchment-100/25 text-xl transition-colors hover:border-crimson-300 hover:text-crimson-300"
              aria-label={t.close}
            >
              ×
            </button>
          </header>

          <p className="border-b border-crimson-500/20 bg-(--assistant-brand-soft) px-5 py-3 text-[0.72rem] leading-relaxed text-ink-700/80">
            {t.notice}
          </p>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
            <div className="max-w-[88%] border-l-2 border-crimson-500 bg-(--assistant-panel) px-4 py-3 text-sm leading-relaxed shadow-[0_1px_0_rgba(48,42,41,0.08)]">
              {t.welcome}
            </div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {t.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submit(prompt)}
                    className="border border-(--assistant-border) bg-transparent px-3 py-2.5 text-left text-xs leading-snug transition-colors hover:border-crimson-500 hover:bg-crimson-500/5 hover:text-crimson-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto max-w-[86%] bg-basalt-900 px-4 py-3 text-parchment-100"
                    : "max-w-[94%] border-l-2 border-crimson-500 bg-(--assistant-panel) px-4 py-3 shadow-[0_1px_0_rgba(48,42,41,0.08)]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text || (busy ? t.sending : "")}</p>
                {message.citations.length > 0 && (
                  <div className="mt-4 border-t border-ink-700/12 pt-3">
                    <p className="text-[0.62rem] font-medium tracking-[0.16em] uppercase">{t.sources}</p>
                    <ol className="mt-2 space-y-1.5 text-[0.7rem] leading-snug">
                      {message.citations.map((citation) => (
                        <li key={`${message.id}-${citation.id}`}>
                          <span className="font-medium">[{citation.id}] </span>
                          {citation.url ? (
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-crimson-500/50 underline-offset-2 hover:text-crimson-600"
                            >
                              {citation.title}
                            </a>
                          ) : (
                            citation.title
                          )}
                          {citation.page ? `, p. ${citation.page}` : ""}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {message.role === "assistant" && message.responseId && !message.failed && (
                  <div className="mt-3 flex gap-3 text-[0.7rem] text-ink-500">
                    <button
                      type="button"
                      disabled={message.rated !== undefined}
                      onClick={() => void rate(message.id, message.responseId!, 1)}
                      className={message.rated === 1 ? "text-crimson-600" : "hover:text-crimson-600"}
                    >
                      + {t.helpful}
                    </button>
                    <button
                      type="button"
                      disabled={message.rated !== undefined}
                      onClick={() => void rate(message.id, message.responseId!, -1)}
                      className={message.rated === -1 ? "text-crimson-600" : "hover:text-crimson-600"}
                    >
                      − {t.notHelpful}
                    </button>
                  </div>
                )}
              </article>
            ))}
            {busy && <p className="text-xs text-ink-500">{t.sending}</p>}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="border-t border-(--assistant-border) bg-(--assistant-paper) p-3"
          >
            <label className="sr-only" htmlFor="beka-assistant-question">{t.placeholder}</label>
            <textarea
              ref={textareaRef}
              id="beka-assistant-question"
              rows={2}
              maxLength={2000}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder={t.placeholder}
              className="w-full resize-none border border-(--assistant-border) bg-(--assistant-panel) px-3 py-2.5 text-sm outline-none placeholder:text-ink-500/65 focus:border-crimson-500"
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <Link href={`/${locale}/contact`} className="text-[0.7rem] underline decoration-crimson-500/45 underline-offset-2 hover:text-crimson-600">
                {t.contact}
              </Link>
              <button
                type="submit"
                disabled={busy || input.trim().length < 2 || !sessionId}
                className="bg-crimson-500 px-5 py-2.5 text-xs tracking-[0.12em] text-white uppercase transition-colors hover:bg-crimson-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t.send}
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="ml-auto flex min-h-12 items-center gap-3 rounded-sm border border-parchment-100/35 bg-crimson-500 px-5 py-3 text-sm font-medium tracking-[0.06em] text-white shadow-[0_12px_30px_rgba(20,17,18,0.22)] transition-colors hover:bg-crimson-600"
      >
        <span aria-hidden="true" className="text-lg">◌</span>
        {t.launcher}
      </button>
    </div>
  );
}
