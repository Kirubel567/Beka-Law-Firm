import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getMatters } from "@/lib/cms/public";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.matters, description: dict.matters.lede };
}

export default async function MattersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const m = dict.matters;
  const items = getMatters(locale as Locale);

  return (
    <>
      <PageHeader kicker={m.kicker} title={m.title} lede={m.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {items.map((item, i) => (
              <Reveal key={item.headline} delay={(i % 2) * 0.08}>
                <article className="flex h-full flex-col border border-basalt-600/15 bg-parchment-50 p-9 md:p-11">
                  <p className="label-caps text-terracotta-600">{item.sector}</p>
                  <h2 className="mt-5 flex-1 font-display text-[1.7rem] leading-snug font-medium text-basalt-900">
                    {item.headline}
                  </h2>
                  <dl className="mt-8 space-y-2.5 border-t border-basalt-600/15 pt-6">
                    {item.facts.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-6 text-sm">
                        <dt className="shrink-0 text-ink-500/60">{k}</dt>
                        <dd className="text-right text-ink-700">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <p className="mx-auto mt-14 max-w-xl text-center text-sm text-ink-500/70 italic">
              {m.note}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
