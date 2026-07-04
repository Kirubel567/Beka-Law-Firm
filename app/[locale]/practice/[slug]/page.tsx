import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, locales } from "@/lib/i18n";
import { en } from "@/lib/content/en";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    en.practice.areas.map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  const area = dict.practice.areas.find((a) => a.slug === slug);
  return {
    title: area ? area.name : dict.nav.practice,
    description: area?.oneLine,
  };
}

export default async function PracticeAreaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  const pr = dict.practice;
  const area = pr.areas.find((a) => a.slug === slug);
  if (!area) notFound();

  return (
    <>
      <PageHeader kicker={pr.kicker} title={area.name} lede={area.oneLine} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-16 px-5 md:grid-cols-[1.6fr_1fr] md:px-8">
          <div>
            {area.detail.map((para, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p
                  className={`leading-loose text-ink-700 ${
                    i === 0
                      ? "font-display text-2xl leading-relaxed text-basalt-800"
                      : "mt-7 text-[1.05rem]"
                  }`}
                >
                  {para}
                </p>
              </Reveal>
            ))}
            <Reveal delay={0.18}>
              <div className="mt-12 flex flex-wrap items-center gap-8">
                <Link
                  href={`/${locale}/contact`}
                  className="border border-basalt-800 px-7 py-3.5 text-[0.72rem] tracking-[0.2em] text-basalt-900 uppercase transition-all duration-700 hover:bg-basalt-900 hover:text-parchment-100"
                >
                  {pr.inquireCta}
                </Link>
                <Link
                  href={`/${locale}/practice`}
                  className="link-quiet label-caps text-brass-600"
                >
                  ← {dict.common.back}
                </Link>
              </div>
            </Reveal>
          </div>

          <aside>
            <Reveal delay={0.1}>
              <div className="border border-basalt-600/15 bg-parchment-50 p-8">
                <h2 className="label-caps text-terracotta-600">{pr.representativeLabel}</h2>
                <ul className="mt-5 space-y-4">
                  {area.representative.map((r) => (
                    <li
                      key={r}
                      className="border-l border-brass-500/50 pl-4 text-sm leading-relaxed text-ink-700"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
