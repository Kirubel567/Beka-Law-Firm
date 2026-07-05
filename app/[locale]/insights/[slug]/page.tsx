import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getDict, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/content/types";
import { getArticle } from "@/lib/cms/public";
import Reveal from "@/components/Reveal";
import { ThreadDivider } from "@/components/Motifs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  const article = getArticle(locale as Locale, slug);
  return {
    // per-article SEO metadata, editable from the portal
    title: article?.seoTitle?.trim() || article?.title || dict.nav.insights,
    description: article?.seoDescription?.trim() || article?.excerpt,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/insights/${slug}`])),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  const article = getArticle(locale as Locale, slug);
  if (!article) notFound();

  return (
    <>
      <section className="basalt-relief relative pt-40 pb-16 text-parchment-100 md:pt-48 md:pb-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <Reveal>
            <div className="label-caps flex flex-wrap items-center gap-4 text-parchment-200/60">
              <span className="text-brass-400">{article.category}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.date}>{formatDate(article.date, locale as Locale)}</time>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="mt-6 font-display text-4xl leading-[1.15] font-medium text-parchment-50 md:text-5xl">
              {article.title}
            </h1>
          </Reveal>
        </div>
      </section>

      <article className="grain relative bg-parchment-100 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <Reveal>
            <p className="font-display text-2xl leading-relaxed text-basalt-800">{article.excerpt}</p>
          </Reveal>
          <div className="rule-brass my-10 w-32" />
          {article.body.map((para, i) => (
            <Reveal key={i} delay={Math.min(i * 0.03, 0.15)}>
              <p className="mt-7 text-[1.05rem] leading-loose text-ink-700 first:mt-0">{para}</p>
            </Reveal>
          ))}
          <Reveal delay={0.1}>
            <ThreadDivider className="mx-auto mt-16 h-6 w-56 text-brass-500/50" />
            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/insights`}
                className="link-quiet label-caps text-brass-600"
              >
                ← {dict.nav.insights}
              </Link>
            </div>
          </Reveal>
        </div>
      </article>
    </>
  );
}
