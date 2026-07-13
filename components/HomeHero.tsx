"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Dict, Locale } from "@/lib/content/types";

const settle = [0.22, 1, 0.36, 1] as const;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.2, delay, ease: settle },
});

/**
 * Cinematic, unhurried arrival — basalt, a seal, and a statement of record.
 * If the firm uploads photography via the portal it appears in the right
 * three-quarters of the frame, behind a basalt overlay so the register never
 * changes. Several images crossfade on a staff-set interval.
 */
export default function HomeHero({
  locale,
  dict,
  heroImages = [],
  heroIntervalSec = 6,
}: {
  locale: Locale;
  dict: Dict;
  heroImages?: string[];
  heroIntervalSec?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const ms = Math.max(2, heroIntervalSec) * 1000;
    const id = setInterval(() => setIndex((n) => (n + 1) % heroImages.length), ms);
    return () => clearInterval(id);
  }, [heroImages.length, heroIntervalSec]);

  return (
    <section className="basalt-relief relative flex min-h-svh flex-col justify-end overflow-hidden text-parchment-100">
      {heroImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, ease: settle }}
          className="absolute inset-y-0 right-0 w-full md:w-3/4"
          aria-hidden="true"
        >
          {heroImages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
                i === index ? "opacity-40" : "opacity-0"
              }`}
            />
          ))}
          {/* basalt overlay — unchanged treatment, keeps the image behind glass */}
          <div className="absolute inset-0 bg-gradient-to-t from-basalt-950 via-basalt-950/75 to-basalt-950/55" />
          {/* left edge dissolves into the basalt so the 75% panel has no hard seam */}
          <div className="absolute inset-0 bg-gradient-to-r from-basalt-950 via-basalt-950/20 to-transparent" />
        </motion.div>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-44 pb-16 md:px-8 md:pb-24">
        <motion.p {...rise(0.2)} className="label-caps text-brass-400">
          {dict.home.kicker}
        </motion.p>

        <motion.h1
          {...rise(0.45)}
          className="mt-8 max-w-4xl font-display text-5xl leading-[1.06] font-medium text-parchment-50 md:text-7xl lg:text-[5.25rem]"
        >
          {dict.home.heroTitle}
        </motion.h1>

        <motion.p
          {...rise(0.75)}
          className="mt-9 max-w-2xl text-lg leading-relaxed font-light text-parchment-200/85 md:text-xl"
        >
          {dict.home.heroLede}
        </motion.p>

        <motion.p {...rise(0.95)} className="mt-4 font-display text-xl text-brass-300 italic">
          {dict.home.heroNote}
        </motion.p>

        {/* the ledger — facts, not stat-blocks */}
        <motion.dl
          {...rise(1.15)}
          className="mt-16 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-5 border-t border-parchment-100/15 pt-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {dict.home.ledger.map(([term, value]) => (
            <div key={term}>
              <dt className="label-caps text-parchment-200/50">{term}</dt>
              <dd className="mt-2 text-sm leading-snug text-parchment-100/90">{value}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div
          {...rise(1.35)}
          className="mt-14 flex flex-wrap items-center gap-8"
        >
          <Link
            href={`/${locale}/contact`}
            className="gold-sheen-border border px-7 py-4 text-[0.72rem] tracking-[0.22em] text-brass-300 uppercase transition-colors duration-700 hover:bg-brass-400/10"
          >
            {dict.nav.requestConsultation}
          </Link>
          <span className="label-caps hidden text-parchment-200/40 md:block">
            {dict.home.scrollHint}
          </span>
        </motion.div>
      </div>

      {/* the thread begins — a brass line dropping out of the hero */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.6, delay: 1.6, ease: settle }}
        className="relative mx-auto h-20 w-px origin-top bg-brass-400/70"
        aria-hidden="true"
      />
    </section>
  );
}
