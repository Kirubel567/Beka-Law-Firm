import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { SealMark } from "@/components/Motifs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.discretion, description: dict.discretion.lede };
}

export default async function DiscretionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const d = dict.discretion;

  return (
    <>
      <PageHeader kicker={d.kicker} title={d.title} lede={d.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <ol className="space-y-14">
            {d.principles.map((p, i) => (
              <Reveal key={p.title} as="li" delay={i * 0.06}>
                <div className="grid gap-5 md:grid-cols-[5rem_1fr]">
                  <span className="font-display text-4xl text-brass-500/60 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-medium text-basalt-900 md:text-3xl">
                      {p.title}
                    </h2>
                    <p className="mt-4 max-w-2xl leading-loose text-ink-500">{p.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.15}>
            <div className="mt-24 border border-brass-500/30 bg-parchment-50 px-8 py-14 text-center md:px-16">
              <SealMark className="mx-auto h-16 w-16 text-brass-500/70" />
              <p className="mx-auto mt-8 max-w-xl font-display text-2xl leading-relaxed text-basalt-800 italic">
                {d.closing}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
