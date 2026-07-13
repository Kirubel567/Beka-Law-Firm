import Link from "next/link";
import type { Dict, Locale } from "@/lib/content/types";
import { locales, localeNames } from "@/lib/i18n";
import { getSite } from "@/lib/cms/store";
import { BekaMark, ThreadDivider } from "./Motifs";
import { SocialIcon, socialLabel } from "./SocialIcons";

export default function Footer({ locale, dict }: { locale: Locale; dict: Dict }) {
  const year = new Date().getFullYear();
  const social = getSite().social ?? [];
  const chapters = [
    { href: `/${locale}/origins`, label: dict.nav.origins },
    { href: `/${locale}/people`, label: dict.nav.people },
    { href: `/${locale}/practice`, label: dict.nav.practice },
    { href: `/${locale}/matters`, label: dict.nav.matters },
    { href: `/${locale}/presence`, label: dict.nav.presence },
    { href: `/${locale}/insights`, label: dict.nav.insights },
  ];
  const firm = [
    { href: `/${locale}/testimonials`, label: dict.nav.testimonials },
    { href: `/${locale}/discretion`, label: dict.nav.discretion },
    { href: `/${locale}/careers`, label: dict.nav.careers },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="basalt-relief relative text-parchment-200">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <ThreadDivider className="mx-auto mb-14 h-6 w-72 text-brass-500/50" />
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BekaMark className="h-14 w-auto" />
            <p className="mt-5 font-display text-xl text-parchment-100">{dict.common.firmFull}</p>
            <p className="label-caps mt-2 text-brass-400/80">{dict.common.estLine}</p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-parchment-200/70">
              {dict.footer.blurb}
            </p>
            {social.length > 0 && (
              <ul className="mt-6 flex items-center gap-3">
                {social.map((s) => (
                  <li key={s.platform + s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={socialLabel(s.platform)}
                      title={socialLabel(s.platform)}
                      className="flex h-9 w-9 items-center justify-center border border-parchment-100/15 text-parchment-200/70 transition-colors hover:border-brass-400/60 hover:text-brass-300"
                    >
                      <SocialIcon platform={s.platform} className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label={dict.footer.chaptersTitle}>
            <h2 className="label-caps text-brass-400">{dict.footer.chaptersTitle}</h2>
            <ul className="mt-5 space-y-3">
              {chapters.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="link-quiet text-sm text-parchment-200/80 hover:text-parchment-50">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footer.firmTitle}>
            <h2 className="label-caps text-brass-400">{dict.footer.firmTitle}</h2>
            <ul className="mt-5 space-y-3">
              {firm.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="link-quiet text-sm text-parchment-200/80 hover:text-parchment-50">
                    {c.label}
                  </Link>
                </li>
              ))}
              <li className="pt-3 text-sm text-parchment-200/60">{dict.contact.office.email}</li>
              <li className="text-sm text-parchment-200/60">{dict.common.cityLine}</li>
            </ul>
          </nav>

          <nav aria-label={dict.footer.languagesTitle}>
            <h2 className="label-caps text-brass-400">{dict.footer.languagesTitle}</h2>
            <ul className="mt-5 space-y-3">
              {locales.map((l) => (
                <li key={l}>
                  <Link
                    href={`/${l}`}
                    lang={l}
                    className={`link-quiet text-sm ${l === locale ? "text-brass-300" : "text-parchment-200/80 hover:text-parchment-50"}`}
                  >
                    {localeNames[l]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 border-t border-parchment-100/10 pt-8">
          <p className="text-xs leading-relaxed text-parchment-200/50">{dict.footer.note}</p>
          <p className="mt-3 text-xs text-parchment-200/50">
            © {year} {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
