import Link from "next/link";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getMatters, getTestimonials } from "@/lib/cms/public";
import { getSite } from "@/lib/cms/store";
import HomeHero from "@/components/HomeHero";
import Reveal from "@/components/Reveal";
import { ThreadDivider } from "@/components/Motifs";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const loc = locale as Locale;
  const site = getSite();
  const quotes = getTestimonials(loc).slice(0, 3);
  const matters = getMatters(loc).slice(0, 3);

  return (
    <>
      <HomeHero
        locale={loc}
        dict={dict}
        heroImages={
          site.heroImages && site.heroImages.length > 0
            ? site.heroImages
            : site.heroImage
              ? [site.heroImage]
              : []
        }
        heroIntervalSec={site.heroIntervalSec ?? 6}
      />

      {/* ——— Chapter index ——— */}
      <section className="grain relative bg-parchment-100 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <p className="label-caps text-brass-600">{dict.home.chaptersKicker}</p>
            <h2 className="mt-5 max-w-2xl font-display text-4xl leading-tight font-medium text-basalt-900 md:text-5xl">
              {dict.home.chaptersTitle}
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink-500">{dict.home.chaptersLede}</p>
          </Reveal>

          <ol className="mt-16 grid gap-x-10 gap-y-2 md:grid-cols-2">
            {dict.home.chapterIndex.map((ch, i) => (
              <Reveal key={ch.href} as="li" delay={i * 0.06}>
                <Link
                  href={`/${loc}${ch.href}`}
                  className="group flex items-baseline gap-6 border-b border-basalt-600/15 py-7 transition-colors duration-500 hover:border-brass-500/60"
                >
                  <span className="font-display text-2xl text-brass-500/80 tabular-nums">
                    {dict.chapters[i]}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-2xl font-medium text-basalt-900 transition-colors duration-500 group-hover:text-brass-600">
                      {ch.title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-500/90">
                      {ch.line}
                    </span>
                  </span>
                  <span
                    className="block h-px w-6 bg-brass-500/50 transition-all duration-700 group-hover:w-10 group-hover:bg-brass-500"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ——— Practice preview ——— */}
      <section className="basalt-relief py-24 text-parchment-100 md:py-32">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <p className="label-caps text-brass-400">{dict.home.practiceKicker}</p>
            <h2 className="mt-5 font-display text-4xl leading-tight font-medium text-parchment-50 md:text-5xl">
              {dict.home.practiceTitle}
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed font-light text-parchment-200/80">
              {dict.home.practiceLede}
            </p>
          </Reveal>

          <div className="mt-16 grid gap-px bg-parchment-100/10 sm:grid-cols-2 lg:grid-cols-3">
            {dict.practice.areas.slice(0, 6).map((area, i) => (
              <Reveal key={area.slug} delay={i * 0.05} className="bg-basalt-900">
                <Link
                  href={`/${loc}/practice/${area.slug}`}
                  className="group block h-full p-8 transition-colors duration-700 hover:bg-basalt-800"
                >
                  <h3 className="font-display text-2xl font-medium text-parchment-100 transition-colors duration-500 group-hover:text-brass-300">
                    {area.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-parchment-200/65">{area.oneLine}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-12">
            <Link
              href={`/${loc}/practice`}
              className="link-quiet label-caps text-brass-300"
            >
              {dict.home.viewAllPractice} →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— Matters teaser ——— */}
      <section className="grain relative bg-parchment-100 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <p className="label-caps text-brass-600">{dict.home.mattersKicker}</p>
            <h2 className="mt-5 font-display text-4xl leading-tight font-medium text-basalt-900 md:text-5xl">
              {dict.home.mattersTitle}
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink-500">{dict.home.mattersLede}</p>
          </Reveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {matters.map((m, i) => (
              <Reveal key={m.headline} delay={i * 0.08}>
                <article className="flex h-full flex-col border border-basalt-600/15 bg-parchment-50 p-8">
                  <p className="label-caps text-terracotta-600">{m.sector}</p>
                  <h3 className="mt-4 flex-1 font-display text-[1.55rem] leading-snug font-medium text-basalt-900">
                    {m.headline}
                  </h3>
                  <dl className="mt-6 space-y-2 border-t border-basalt-600/15 pt-5">
                    {m.facts.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-[0.8rem]">
                        <dt className="text-ink-500/60">{k}</dt>
                        <dd className="text-right text-ink-700">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-12">
            <Link href={`/${loc}/matters`} className="link-quiet label-caps text-brass-600">
              {dict.home.viewAllMatters} →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— In their words ——— */}
      <section className="border-y border-basalt-600/10 bg-parchment-50 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <Reveal className="text-center">
            <p className="label-caps text-brass-600">{dict.home.quotesKicker}</p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight font-medium text-basalt-900 md:text-4xl">
              {dict.home.quotesTitle}
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {quotes.map((q, i) => (
              <Reveal key={`${q.attribution}-${i}`} delay={i * 0.1}>
                <figure className="flex h-full flex-col">
                  <blockquote className="flex-1 font-display text-xl leading-relaxed text-basalt-800 italic">
                    “{q.text}”
                  </blockquote>
                  <figcaption className="label-caps mt-6 text-ink-500/70">
                    — {q.attribution}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.25}>
            <p className="mx-auto mt-14 max-w-xl text-center text-sm leading-relaxed text-ink-500/70">
              {dict.home.quotesNote}
            </p>
            <p className="mt-6 text-center">
              <Link
                href={`/${loc}/testimonials`}
                className="link-quiet label-caps text-brass-600"
              >
                {dict.home.viewAllQuotes} →
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ——— Discretion note ——— */}
      <section className="basalt-relief py-24 text-parchment-100 md:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
          <Reveal>
            <ThreadDivider className="mx-auto mb-10 h-6 w-64 text-brass-500/60" />
            <p className="label-caps text-brass-400">{dict.home.discretionKicker}</p>
            <h2 className="mt-5 font-display text-3xl leading-tight font-medium text-parchment-50 md:text-4xl">
              {dict.home.discretionTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl leading-relaxed font-light text-parchment-200/80">
              {dict.home.discretionText}
            </p>
            <Link
              href={`/${loc}/discretion`}
              className="link-quiet label-caps mt-9 inline-block text-brass-300"
            >
              {dict.home.discretionLink} →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— Contact invitation ——— */}
      <section className="grain relative bg-parchment-100 py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
          <Reveal>
            <p className="label-caps text-brass-600">{dict.home.contactKicker}</p>
            <h2 className="mt-5 font-display text-4xl leading-tight font-medium text-basalt-900 md:text-5xl">
              {dict.home.contactTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-500">
              {dict.home.contactText}
            </p>
            <Link
              href={`/${loc}/contact`}
              className="mt-10 inline-block border border-basalt-800 px-9 py-4 text-[0.72rem] tracking-[0.22em] text-basalt-900 uppercase transition-all duration-700 hover:bg-basalt-900 hover:text-parchment-100"
            >
              {dict.home.contactCta}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
