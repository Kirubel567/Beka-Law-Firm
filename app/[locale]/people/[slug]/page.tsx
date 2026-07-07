import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getPerson } from "@/lib/cms/public";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  const person = getPerson(locale as Locale, slug);
  return { title: person ? `${person.name} — ${person.role}` : dict.nav.people };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  const p = dict.people;
  const person = getPerson(locale as Locale, slug);
  if (!person) notFound();

  return (
    <>
      <PageHeader kicker={person.role} title={person.name} lede={person.custodyOf} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-16 px-5 md:grid-cols-[1.6fr_1fr] md:px-8">
          <div>
            {person.bio.map((para, i) => (
              <Reveal key={i} delay={i * 0.05}>
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
            <Reveal delay={0.2}>
              <Link
                href={`/${locale}/people`}
                className="link-quiet label-caps mt-12 inline-block text-brass-600"
              >
                ← {dict.common.back}
              </Link>
            </Reveal>
          </div>

          <aside>
            {person.image && (
              <Reveal>
                <div className="relative mb-8 overflow-hidden border border-basalt-600/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.image}
                    alt={person.name}
                    className="aspect-[4/5] w-full object-cover grayscale-[0.85]"
                  />
                  <div className="absolute inset-0 bg-brass-500/15 mix-blend-multiply" aria-hidden="true" />
                </div>
              </Reveal>
            )}
            <Reveal delay={0.1}>
              <div className="border border-basalt-600/15 bg-parchment-50 p-8">
                <h2 className="label-caps text-terracotta-600">{p.credentialsLabel}</h2>
                <ul className="mt-5 space-y-4">
                  {person.credentials.map((c) => (
                    <li
                      key={c}
                      className="border-l border-brass-500/50 pl-4 text-sm leading-relaxed text-ink-700"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
                <h2 className="label-caps mt-9 text-terracotta-600">{p.languagesLabel}</h2>
                <p className="mt-3 text-sm text-ink-700">{person.languages}</p>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
