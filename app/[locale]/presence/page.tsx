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
  return { title: dict.nav.presence, description: dict.presence.lede };
}

export default async function PresencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const pz = dict.presence;

  return (
    <>
      <PageHeader kicker={pz.kicker} title={pz.title} lede={pz.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-3">
            {pz.blocks.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.08}>
                <div className="h-full border-t-2 border-brass-500/60 pt-7">
                  <h2 className="font-display text-2xl font-medium text-basalt-900">{b.title}</h2>
                  <p className="mt-4 leading-relaxed text-ink-500">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="basalt-relief py-20 text-parchment-100 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 md:grid-cols-3 md:px-8">
          <Reveal>
            <div>
              <SealMark className="h-10 w-10 text-brass-400" />
              <h2 className="label-caps mt-6 text-brass-400">{pz.affiliationsTitle}</h2>
              <ul className="mt-6 space-y-4">
                {pz.affiliations.map((a) => (
                  <li
                    key={a}
                    className="border-l border-brass-500/40 pl-4 text-sm leading-relaxed text-parchment-200/85"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <h2 className="label-caps text-brass-400 md:mt-16">{pz.languagesTitle}</h2>
              <ul className="mt-6 space-y-3">
                {pz.languages.map((l) => (
                  <li key={l} className="font-display text-2xl text-parchment-100">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div>
              <h2 className="label-caps text-brass-400 md:mt-16">{pz.jurisdictionsTitle}</h2>
              <ul className="mt-6 space-y-4">
                {pz.jurisdictions.map((j) => (
                  <li
                    key={j}
                    className="border-l border-brass-500/40 pl-4 text-sm leading-relaxed text-parchment-200/85"
                  >
                    {j}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
