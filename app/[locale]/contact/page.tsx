import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { getSite } from "@/lib/cms/store";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";

const OFFICE_MAP_EMBED =
  "https://www.google.com/maps?q=Keklifa+Sabit+Building+South+Africa+Street+Addis+Ababa&output=embed";
const OFFICE_MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=Keklifa+Sabit+Building+South+Africa+Street+Office+A200-A201+Addis+Ababa+Ethiopia";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.nav.contact, description: dict.contact.lede };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDict(locale);
  const c = dict.contact;
  // office details are managed from the staff portal; dictionary values are the fallback
  const site = getSite();
  const phone = site.phone?.trim() || c.office.phone;
  const email = site.email?.trim() || c.office.email;

  return (
    <>
      <PageHeader kicker={c.kicker} title={c.title} lede={c.lede} />

      <section className="grain relative bg-parchment-100 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-16 px-5 md:grid-cols-[1.5fr_1fr] md:px-8">
          <Reveal>
            <ContactForm dict={dict} />
            <p className="mt-10 max-w-xl text-xs leading-relaxed text-ink-500/60">
              {c.privacyNote}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <aside className="basalt-relief h-fit overflow-hidden text-parchment-100">
              <div className="p-9 pb-7 md:p-11 md:pb-8">
                <h2 className="label-caps text-brass-400">{c.office.title}</h2>
                <div className="mt-6 flex gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-crimson-400/45 bg-crimson-500/12 text-crimson-300"
                    aria-hidden="true"
                  >
                    <LocationIcon />
                  </span>
                  <div>
                    {c.office.lines.map((line, index) => (
                      <p
                        key={line}
                        className={
                          index === 0
                            ? "mb-3 font-display text-xl leading-snug text-parchment-50"
                            : "text-sm leading-6 text-parchment-200/76"
                        }
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative h-56 overflow-hidden border-y border-parchment-100/12 bg-basalt-800">
                <iframe
                  src={OFFICE_MAP_EMBED}
                  title={c.office.mapTitle}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0 opacity-80 grayscale-[22%] saturate-[.72] contrast-[.92]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-basalt-900/35 via-transparent to-basalt-900/10" />
                <a
                  href={OFFICE_MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group absolute top-4 left-4 inline-flex items-center gap-2 border border-basalt-900/10 bg-parchment-50 px-4 py-2.5 text-[0.7rem] font-medium tracking-[0.1em] text-basalt-900 uppercase shadow-[0_8px_28px_rgba(20,17,18,0.2)] transition-all duration-300 hover:border-crimson-500/35 hover:text-crimson-700 hover:shadow-[0_10px_34px_rgba(20,17,18,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-400"
                  aria-label={c.office.mapTitle}
                >
                  <LocationIcon className="h-4 w-4 text-crimson-500" />
                  {c.office.mapLabel}
                  <ExternalLinkIcon />
                </a>
              </div>

              <div className="p-9 pt-7 md:p-11 md:pt-8">
                <dl className="space-y-6">
                  <div>
                    <dt className="label-caps text-parchment-200/50">{c.office.emailLabel}</dt>
                    <dd className="mt-1.5">
                      <a href={`mailto:${email}`} className="link-quiet text-parchment-100">
                        {email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-parchment-200/50">{c.office.phoneLabel}</dt>
                    <dd className="mt-1.5 text-parchment-100">{phone}</dd>
                  </div>
                  <div>
                    <dt className="label-caps text-parchment-200/50">{c.office.hoursLabel}</dt>
                    <dd className="mt-1.5 text-parchment-100">{c.office.hours}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function LocationIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      aria-hidden="true"
    >
      <path d="M7 4h9v9M16 4 7 13" />
      <path d="M13 10v6H4V7h6" />
    </svg>
  );
}
