import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { getSite } from "@/lib/cms/store";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";

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
            <aside className="basalt-relief h-fit p-9 text-parchment-100 md:p-11">
              <h2 className="label-caps text-brass-400">{c.office.title}</h2>
              <div className="mt-6 space-y-1">
                {c.office.lines.map((line) => (
                  <p key={line} className="font-display text-xl text-parchment-100">
                    {line}
                  </p>
                ))}
              </div>
              <dl className="mt-9 space-y-6">
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
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
