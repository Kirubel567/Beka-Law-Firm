"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Dict } from "@/lib/content/types";
import { localeNames, locales } from "@/lib/i18n";

const settle = [0.22, 1, 0.36, 1] as const;

type Phase = "idle" | "sending" | "sealed";

/**
 * The inquiry form — "requesting an audience", not lead-gen.
 * Submission is confirmed by the seal being drawn: the firm's mark
 * settling onto the correspondence.
 */
export default function ContactForm({ dict }: { dict: Dict }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const f = dict.contact.form;

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase !== "idle") return;
    setPhase("sending");
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const started = Date.now();
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("send failed");
      // let the seal take its time — the confirmation should feel deliberate
      const remaining = Math.max(0, 1200 - (Date.now() - started));
      window.setTimeout(() => setPhase("sealed"), remaining);
    } catch {
      setError("Something went wrong. Please try again, or write to us directly by email.");
      setPhase("idle");
    }
  };

  const field =
    "w-full border-b border-basalt-600/30 bg-transparent py-3 text-basalt-900 placeholder:text-ink-500/40 focus:border-brass-500 focus:outline-none transition-colors duration-500";
  const label = "label-caps block text-ink-500/80 mb-1";

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {phase !== "sealed" ? (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6, ease: settle }}
            className="space-y-9"
          >
            <div className="grid gap-9 md:grid-cols-2">
              <div>
                <label htmlFor="cf-name" className={label}>
                  {f.name}
                </label>
                <input id="cf-name" name="name" type="text" required className={field} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="cf-org" className={label}>
                  {f.organization} <span className="normal-case opacity-60">({f.organizationOptional})</span>
                </label>
                <input id="cf-org" name="organization" type="text" className={field} autoComplete="organization" />
              </div>
            </div>

            <div className="grid gap-9 md:grid-cols-2">
              <div>
                <label htmlFor="cf-email" className={label}>
                  {f.email}
                </label>
                <input id="cf-email" name="email" type="email" required className={field} autoComplete="email" />
              </div>
              <div>
                <label htmlFor="cf-lang" className={label}>
                  {f.language}
                </label>
                <select id="cf-lang" name="language" className={`${field} cursor-pointer`}>
                  {locales.map((l) => (
                    <option key={l} value={l}>
                      {localeNames[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="cf-matter" className={label}>
                {f.matter}
              </label>
              <select id="cf-matter" name="matter" className={`${field} cursor-pointer`}>
                {f.matterOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cf-message" className={label}>
                {f.message}
              </label>
              <textarea id="cf-message" name="message" rows={5} required className={`${field} resize-none`} />
              <p className="mt-2 text-xs text-ink-500/60">{f.messageHint}</p>
            </div>

            {/* honeypot — invisible to people, irresistible to bots */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="cf-website">Website</label>
              <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {error && <p className="text-sm text-terracotta-600">{error}</p>}

            <button
              type="submit"
              disabled={phase === "sending"}
              className="group relative inline-flex items-center gap-4 border border-basalt-800 px-8 py-4 text-[0.72rem] tracking-[0.22em] text-basalt-900 uppercase transition-all duration-700 hover:bg-basalt-900 hover:text-parchment-100 disabled:opacity-60"
            >
              {phase === "sending" ? f.sending : f.submit}
              <span className="block h-px w-8 bg-current transition-all duration-700 group-hover:w-12" aria-hidden="true" />
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="sealed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: settle }}
            className="border border-brass-500/40 bg-parchment-50 px-8 py-14 text-center md:px-16"
            role="status"
          >
            <DrawnSeal />
            <h2 className="mt-8 font-display text-3xl font-medium text-basalt-900">
              {dict.contact.confirmation.title}
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-500">
              {dict.contact.confirmation.text}
            </p>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="link-quiet mt-8 text-[0.72rem] tracking-[0.2em] text-brass-600 uppercase"
            >
              {dict.contact.confirmation.again}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DrawnSeal() {
  const drawn = (delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 1.6, delay, ease: settle },
  });
  return (
    <svg viewBox="0 0 96 96" fill="none" className="mx-auto h-24 w-24 text-brass-500" aria-hidden="true">
      <motion.circle cx="48" cy="48" r="45" stroke="currentColor" strokeWidth="1" {...drawn(0)} />
      <motion.rect
        x="30"
        y="30"
        width="36"
        height="36"
        transform="rotate(45 48 48)"
        stroke="currentColor"
        strokeWidth="0.8"
        {...drawn(0.5)}
      />
      <motion.path d="M48 20v56M20 48h56" stroke="currentColor" strokeWidth="0.8" {...drawn(0.9)} />
      <motion.circle cx="48" cy="48" r="4" stroke="currentColor" strokeWidth="0.9" {...drawn(1.4)} />
    </svg>
  );
}
