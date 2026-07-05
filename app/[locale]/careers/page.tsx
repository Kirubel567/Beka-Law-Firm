import type { Metadata } from "next";
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
  return { title: dict.nav.careers, description: dict.careers.lede };
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const c = dict.careers;

  return (
    <>
      <PageHeader kicker={c.kicker} title={c.title} lede={c.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          {c.body.map((p, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p
                className={`leading-loose text-ink-700 ${
                  i === 0
                    ? "font-display text-2xl leading-relaxed text-basalt-800"
                    : "mt-8 text-[1.05rem]"
                }`}
              >
                {p}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.15}>
            <div className="mt-16 border border-basalt-600/15 bg-parchment-50 p-9 md:p-12">
              <h2 className="font-display text-2xl font-medium text-basalt-900">{c.howTitle}</h2>
              <ol className="mt-7 space-y-5">
                {c.how.map((step, i) => (
                  <li key={i} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3">
                    <span className="font-display text-xl text-brass-500">{i + 1}.</span>
                    <span className="leading-relaxed text-ink-700">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="rule-brass my-8 w-24" />
              <p className="text-sm leading-relaxed text-ink-500">{c.mailLine}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
