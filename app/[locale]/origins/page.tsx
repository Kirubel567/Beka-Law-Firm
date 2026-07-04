import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import Timeline from "@/components/Timeline";
import { ThreadDivider } from "@/components/Motifs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.origins, description: dict.origins.lede };
}

export default async function OriginsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const o = dict.origins;

  return (
    <>
      <PageHeader kicker={o.kicker} title={o.title} lede={o.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          {o.story.map((p, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p
                className={`leading-loose text-ink-700 ${i === 0 ? "font-display text-2xl leading-relaxed text-basalt-800" : "mt-8 text-[1.05rem]"}`}
              >
                {p}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-basalt-600/10 bg-parchment-50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-medium text-basalt-900 md:text-4xl">
              {o.principlesTitle}
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            {o.principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07}>
                <div className="border-l border-brass-500/50 pl-7">
                  <h3 className="font-display text-2xl font-medium text-basalt-900">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-500">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="grain relative bg-parchment-100 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal className="text-center">
            <ThreadDivider className="mx-auto mb-9 h-6 w-64 text-brass-500/60" />
            <p className="label-caps text-brass-600">{o.timelineKicker}</p>
            <h2 className="mt-4 font-display text-4xl font-medium text-basalt-900 md:text-5xl">
              {o.timelineTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink-500">{o.timelineLede}</p>
          </Reveal>
          <div className="mt-20">
            <Timeline entries={o.timeline} contextLabel={o.contextLabel} />
          </div>
        </div>
      </section>
    </>
  );
}
