import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getTestimonials } from "@/lib/cms/public";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { ThreadDivider } from "@/components/Motifs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.testimonials, description: dict.testimonials.lede };
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const t = dict.testimonials;
  const quotes = getTestimonials(locale as Locale);

  return (
    <>
      <PageHeader kicker={t.kicker} title={t.title} lede={t.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="space-y-4">
            {quotes.map((q, i) => (
              <Reveal key={`${q.attribution}-${i}`} delay={Math.min(i * 0.05, 0.2)}>
                <figure className="border border-basalt-600/15 bg-parchment-50 px-9 py-10 md:px-12">
                  <blockquote className="font-display text-2xl leading-relaxed text-basalt-800 italic">
                    “{q.text}”
                  </blockquote>
                  <figcaption className="label-caps mt-6 text-ink-500/70">
                    — {q.attribution}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <ThreadDivider className="mx-auto mt-16 h-6 w-56 text-brass-500/50" />
            <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-ink-500/70 italic">
              {t.note}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
