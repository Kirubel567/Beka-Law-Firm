import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Outfit,
  Noto_Serif_Ethiopic,
  Noto_Sans_Ethiopic,
} from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDict, isLocale, locales } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Latin display/body paired with Ethiopic display/body of equal weight.
 * Per-glyph fallback means one stack serves all three languages:
 * Latin text renders Cormorant/Outfit, Ge'ez renders Noto Ethiopic —
 * Amharic typesetting is a first citizen, not a bolted-on font.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-outfit",
  display: "swap",
});

const ethioSerif = Noto_Serif_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ethioserif",
  display: "swap",
});

const ethioSans = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["300", "400", "500"],
  variable: "--font-ethiosans",
  display: "swap",
});

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
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${cormorant.variable} ${outfit.variable} ${ethioSerif.variable} ${ethioSans.variable}`}
    >
      <body className="font-body antialiased">
        <Header locale={locale} dict={dict} />
        <main>{children}</main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
