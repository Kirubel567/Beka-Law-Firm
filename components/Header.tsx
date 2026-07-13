"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Dict, Locale } from "@/lib/content/types";
import { locales, localeNames } from "@/lib/i18n";
import { Wordmark } from "./Motifs";

const settle = [0.22, 1, 0.36, 1] as const;

export default function Header({ locale, dict }: { locale: Locale; dict: Dict }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const rest = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  const links = [
    { href: `/${locale}/origins`, label: dict.nav.origins },
    { href: `/${locale}/people`, label: dict.nav.people },
    { href: `/${locale}/practice`, label: dict.nav.practice },
    { href: `/${locale}/matters`, label: dict.nav.matters },
    { href: `/${locale}/presence`, label: dict.nav.presence },
    { href: `/${locale}/insights`, label: dict.nav.insights },
  ];

  const secondary = [
    { href: `/${locale}/testimonials`, label: dict.nav.testimonials },
    { href: `/${locale}/discretion`, label: dict.nav.discretion },
    { href: `/${locale}/careers`, label: dict.nav.careers },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 text-parchment-100 transition-all duration-700 ${
        scrolled || open
          ? "bg-basalt-950/95 shadow-[0_1px_0_0_rgba(240,214,122,0.18)] backdrop-blur-sm"
          : "bg-gradient-to-b from-basalt-950/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href={`/${locale}`} aria-label={dict.common.firmFull} className="text-parchment-100">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`link-quiet text-[0.8rem] tracking-[0.08em] ${
                isActive(l.href) ? "text-brass-300" : "text-parchment-200/90 hover:text-parchment-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-parchment-100/20" aria-hidden="true" />
          <LangSwitch locale={locale} rest={rest} />
          <Link
            href={`/${locale}/contact`}
            className="gold-sheen-border border px-4 py-2 text-[0.72rem] tracking-[0.18em] text-brass-300 uppercase transition-colors duration-500 hover:bg-brass-400/10"
          >
            {dict.nav.requestConsultation}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="-mr-2 flex h-11 w-11 items-center justify-center text-parchment-100 lg:hidden"
          aria-expanded={open}
          aria-label={open ? dict.nav.close : dict.nav.menu}
        >
          <span className="flex flex-col gap-[6px]" aria-hidden="true">
            <span
              className={`block h-px w-6 bg-current transition-transform duration-500 ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-6 bg-current transition-transform duration-500 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>
    </header>

      {/* the mobile menu lives outside the header: its backdrop-blur makes the
          header a containing block for fixed children, collapsing them to 0px */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: settle }}
            className="basalt-relief fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto text-parchment-100 lg:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-10" aria-label="Mobile">
              {[...links, ...secondary].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.06 * i, ease: settle }}
                >
                  <Link
                    href={l.href}
                    className={`block border-b border-parchment-100/10 py-4 font-display text-2xl ${
                      isActive(l.href) ? "text-brass-300" : "text-parchment-100"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-8">
                <LangSwitch locale={locale} rest={rest} large />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LangSwitch({
  locale,
  rest,
  large = false,
}: {
  locale: Locale;
  rest: string;
  large?: boolean;
}) {
  return (
    <span className={`flex items-center ${large ? "gap-5" : "gap-2.5"}`}>
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest === "/" ? "" : rest}`}
          lang={l}
          aria-label={localeNames[l]}
          aria-current={l === locale ? "true" : undefined}
          className={`${large ? "text-base" : "text-[0.72rem]"} tracking-[0.12em] uppercase transition-colors duration-400 ${
            l === locale ? "text-brass-300" : "text-parchment-200/60 hover:text-parchment-100"
          }`}
        >
          {l === "om" ? "OR" : l.toUpperCase()}
        </Link>
      ))}
    </span>
  );
}
