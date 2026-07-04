"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import type { TimelineEntry } from "@/lib/content/types";
import Reveal from "./Reveal";

/**
 * The Unbroken Line — a brass thread that draws itself down the chronicle
 * as the reader scrolls. Firm milestones sit on the line in full weight;
 * national milestones in lighter type beside it.
 */
export default function Timeline({
  entries,
  contextLabel,
}: {
  entries: TimelineEntry[];
  contextLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.6"],
  });
  const drawn = useSpring(scrollYProgress, { stiffness: 60, damping: 24, mass: 1.2 });

  return (
    <div ref={ref} className="relative mx-auto max-w-3xl">
      {/* the dormant line */}
      <div className="absolute top-0 bottom-0 left-[7px] w-px bg-brass-500/20 md:left-1/2" />
      {/* the drawn line */}
      <motion.div
        style={{ scaleY: drawn }}
        className="absolute top-0 bottom-0 left-[7px] w-px origin-top bg-brass-400 md:left-1/2"
      />
      <ol className="space-y-16 md:space-y-20">
        {entries.map((entry, i) => {
          const right = i % 2 === 1;
          const isContext = entry.kind === "context";
          return (
            <li key={`${entry.year}-${i}`} className="relative">
              {/* node */}
              <span
                className={`absolute top-1.5 left-[7px] block h-[9px] w-[9px] -translate-x-1/2 rotate-45 md:left-1/2 ${
                  isContext ? "border border-brass-500/60 bg-parchment-100" : "bg-brass-400"
                }`}
              />
              <Reveal
                className={`pl-8 md:w-[calc(50%-2.5rem)] md:pl-0 ${
                  right ? "md:ml-auto md:text-left" : "md:text-right"
                }`}
              >
                <p
                  className={`font-display text-2xl ${
                    isContext ? "text-ink-500/70" : "text-basalt-800"
                  }`}
                >
                  {entry.year}
                </p>
                {isContext && (
                  <p className="label-caps mt-1 text-brass-600/80">{contextLabel}</p>
                )}
                <h3
                  className={`mt-2 font-display text-xl ${
                    isContext ? "font-normal text-ink-500" : "font-medium text-basalt-900"
                  }`}
                >
                  {entry.title}
                </h3>
                <p className={`mt-2 text-[0.95rem] leading-relaxed ${isContext ? "text-ink-500/80" : "text-ink-500"}`}>
                  {entry.text}
                </p>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
