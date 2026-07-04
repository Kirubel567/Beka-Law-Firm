import type { Metadata } from "next";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getPeople } from "@/lib/cms/public";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { SealMark } from "@/components/Motifs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.people, description: dict.people.lede };
}

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const p = dict.people;
  const partners = getPeople(locale as Locale);

  return (
    <>
      <PageHeader kicker={p.kicker} title={p.title} lede={p.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-5xl space-y-10 px-5 md:px-8">
          {partners.map((partner, i) => (
            <Reveal key={partner.slug} delay={i * 0.08}>
              <Link
                href={`/${locale}/people/${partner.slug}`}
                className="group grid gap-8 border border-basalt-600/15 bg-parchment-50 p-8 transition-colors duration-700 hover:border-brass-500/50 md:grid-cols-[auto_1fr_auto] md:items-center md:p-12"
              >
                <SealMark className="hidden h-20 w-20 text-brass-500/40 transition-colors duration-700 group-hover:text-brass-500/80 md:block" />
                <span>
                  <span className="block font-display text-3xl font-medium text-basalt-900 transition-colors duration-500 group-hover:text-brass-600 md:text-4xl">
                    {partner.name}
                  </span>
                  <span className="label-caps mt-2 block text-terracotta-600">{partner.role}</span>
                  <span className="mt-4 block max-w-xl text-sm leading-relaxed text-ink-500">
                    <span className="label-caps block text-ink-500/60">{p.custodyLabel}</span>
                    <span className="mt-1 block">{partner.custodyOf}</span>
                  </span>
                </span>
                <span className="label-caps flex items-center gap-3 text-brass-600">
                  {p.readProfile}
                  <span
                    className="block h-px w-6 bg-brass-500/60 transition-all duration-700 group-hover:w-10"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={0.2}>
            <p className="mx-auto max-w-2xl pt-8 text-center text-sm leading-relaxed text-ink-500/80 italic">
              {p.directoryNote}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
