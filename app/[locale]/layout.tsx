import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDict, isLocale, locales } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LegalAssistant from "@/components/assistant/LegalAssistant";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: {
      default: dict.meta.titleSuffix,
      template: `%s — ${dict.meta.siteName}`,
    },
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDict(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-body antialiased">
        <Header locale={locale} dict={dict} />
        <main>{children}</main>
        <Footer locale={locale} dict={dict} />
        <LegalAssistant locale={locale} />
      </body>
    </html>
  );
}
