import type { Metadata } from "next";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.practice, description: dict.practice.lede };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const pr = dict.practice;

  return (
    <>
      <PageHeader kicker={pr.kicker} title={pr.title} lede={pr.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <ol>
            {pr.areas.map((area, i) => (
              <Reveal key={area.slug} as="li" delay={Math.min(i * 0.04, 0.2)}>
                <Link
                  href={`/${locale}/practice/${area.slug}`}
                  className="group grid gap-4 border-b border-basalt-600/15 py-9 transition-colors duration-500 hover:border-brass-500/60 md:grid-cols-[4rem_1fr_1.2fr_auto] md:items-baseline md:gap-8"
                >
                  <span className="font-display text-xl text-brass-500/70 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-2xl leading-snug font-medium text-basalt-900 transition-colors duration-500 group-hover:text-brass-600 md:text-[1.7rem]">
                    {area.name}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-500">{area.oneLine}</span>
                  <span
                    className="hidden h-px w-6 bg-brass-500/50 transition-all duration-700 group-hover:w-12 group-hover:bg-brass-500 md:block"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
