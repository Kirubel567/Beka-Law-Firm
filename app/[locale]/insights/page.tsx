import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getArticles } from "@/lib/cms/public";
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
  return { title: dict.nav.insights, description: dict.insights.lede };
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const ins = dict.insights;
  const articles = getArticles(locale as Locale);

  return (
    <>
      <PageHeader kicker={ins.kicker} title={ins.title} lede={ins.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <ol className="space-y-2">
            {articles.map((a, i) => (
              <Reveal key={a.slug} as="li" delay={i * 0.07}>
                <Link
                  href={`/${locale}/insights/${a.slug}`}
                  className="group block border-b border-basalt-600/15 py-10 transition-colors duration-500 hover:border-brass-500/60"
                >
                  <div className="label-caps flex flex-wrap items-center gap-4 text-ink-500/60">
                    <span className="text-terracotta-600">{a.category}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={a.date}>{formatDate(a.date, locale as Locale)}</time>
                  </div>
                  <h2 className="mt-4 font-display text-3xl leading-snug font-medium text-basalt-900 transition-colors duration-500 group-hover:text-brass-600 md:text-4xl">
                    {a.title}
                  </h2>
                  <p className="mt-4 max-w-2xl leading-relaxed text-ink-500">{a.excerpt}</p>
                  <span className="link-quiet label-caps mt-6 inline-block text-brass-600">
                    {ins.readArticle} →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
