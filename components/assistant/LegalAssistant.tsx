"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/lib/content/types";
import type { AssistantCitation, AssistantHistoryMessage } from "@/lib/assistant/types";
import { BekaMark } from "@/components/Motifs";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [busy, messages, open]);

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
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label={t.close}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[1000] cursor-default bg-basalt-950/38 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div className="fixed right-4 bottom-4 z-[1001] md:right-7 md:bottom-7" lang={locale}>
      <AnimatePresence>
      {open && (
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 flex h-[min(700px,calc(100svh-6.75rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/55 bg-(--assistant-paper) text-(--assistant-ink) shadow-[0_30px_100px_rgba(20,17,18,0.38),0_8px_28px_rgba(20,17,18,0.2)]"
        >
          <header className="relative overflow-hidden border-b border-parchment-100/12 bg-[linear-gradient(135deg,#211b1c_0%,#141112_60%,#30191c_100%)] px-5 py-4 text-parchment-100">
            <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_top_right,rgba(158,45,51,0.32),transparent_66%)]" aria-hidden="true" />
            <div className="relative flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/95 p-1.5 shadow-sm">
                <BekaMark className="h-full w-auto" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xl font-medium leading-tight">{t.title}</p>
                  <span className="rounded-full border border-crimson-300/35 bg-crimson-500/16 px-2 py-0.5 text-[0.58rem] font-medium tracking-[0.16em] text-crimson-300 uppercase">AI</span>
                </div>
                <p className="mt-1 text-[0.7rem] leading-snug text-parchment-200/72">{t.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-parchment-100/20 text-parchment-100/80 transition-colors hover:border-crimson-300/65 hover:bg-white/5 hover:text-white"
                aria-label={t.close}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex items-start gap-2.5 border-b border-crimson-500/15 bg-(--assistant-brand-soft) px-5 py-3 text-[0.69rem] leading-relaxed text-ink-700/78">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-crimson-600" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" />
            </svg>
            <p>{t.notice}</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-color:rgba(158,45,51,0.3)_transparent]" aria-live="polite">
            <div className="flex max-w-[94%] items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-crimson-500 text-white shadow-sm" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                  <circle cx="12" cy="12" r="3.6" />
                </svg>
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-(--assistant-border) bg-(--assistant-panel) px-4 py-3 text-sm leading-relaxed shadow-[0_5px_18px_rgba(48,42,41,0.06)]">
                {t.welcome}
              </div>
            </div>
            {messages.length === 0 && (
              <div className="grid gap-2 pl-9">
                {t.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submit(prompt)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-(--assistant-border) bg-white/48 px-3.5 py-2.5 text-left text-xs leading-snug transition-all hover:-translate-y-px hover:border-crimson-500/55 hover:bg-white hover:text-crimson-700 hover:shadow-sm"
                  >
                    <span>{prompt}</span>
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5 group-hover:text-crimson-600" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-basalt-900 px-4 py-3 text-parchment-100 shadow-sm"
                    : "max-w-[94%] rounded-2xl rounded-tl-sm border border-(--assistant-border) bg-(--assistant-panel) px-4 py-3 shadow-[0_5px_18px_rgba(48,42,41,0.06)]"
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
            {busy && (
              <div className="flex items-center gap-2 pl-9 text-xs text-ink-500">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-500" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-500 [animation-delay:160ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-500 [animation-delay:320ms]" />
                </span>
                {t.sending}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="border-t border-(--assistant-border) bg-white/58 p-3.5 backdrop-blur-sm"
          >
            <label className="sr-only" htmlFor="beka-assistant-question">{t.placeholder}</label>
            <div className="flex items-end gap-2 rounded-2xl border border-(--assistant-border) bg-(--assistant-panel) p-2 shadow-inner transition-colors focus-within:border-crimson-500/70 focus-within:ring-2 focus-within:ring-crimson-500/8">
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
                className="min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-ink-500/58"
              />
              <button
                type="submit"
                disabled={busy || input.trim().length < 2 || !sessionId}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crimson-500 text-white shadow-sm transition-all hover:-translate-y-px hover:bg-crimson-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                aria-label={t.send}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <path d="m5 12 7-7 7 7M12 5v14" />
                </svg>
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-4 px-1">
              <Link href={`/${locale}/contact`} className="text-[0.7rem] underline decoration-crimson-500/45 underline-offset-2 hover:text-crimson-600">
                {t.contact}
              </Link>
              <span className="text-[0.64rem] text-ink-500/72">Enter ↵</span>
            </div>
          </form>
        </motion.section>
      )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t.close : t.launcher}
        className={`ml-auto flex h-13 items-center justify-center border border-white/25 bg-crimson-500 text-sm font-medium text-white shadow-[0_14px_38px_rgba(20,17,18,0.3)] transition-all hover:-translate-y-0.5 hover:bg-crimson-600 hover:shadow-[0_18px_44px_rgba(20,17,18,0.34)] ${open ? "w-13 rounded-full" : "gap-2.5 rounded-full px-4.5 tracking-[0.04em]"}`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/14" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                <circle cx="12" cy="12" r="3.6" />
              </svg>
            </span>
            {t.launcher}
          </>
        )}
      </button>
      </div>
    </>
  );
}
