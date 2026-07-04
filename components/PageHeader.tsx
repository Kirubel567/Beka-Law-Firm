import Reveal from "./Reveal";

/**
 * Shared chapter opening for interior pages — a dark, composed frontispiece.
 */
export default function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: string;
}) {
  return (
    <section className="basalt-relief relative pt-40 pb-20 text-parchment-100 md:pt-48 md:pb-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <Reveal>
          <p className="label-caps text-brass-400">{kicker}</p>
        </Reveal>
        <Reveal delay={0.12}>
          <h1 className="mt-6 font-display text-4xl leading-[1.12] font-medium text-parchment-50 md:text-6xl">
            {title}
          </h1>
        </Reveal>
        {lede && (
          <Reveal delay={0.24}>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed font-light text-parchment-200/85">
              {lede}
            </p>
          </Reveal>
        )}
        <Reveal delay={0.32}>
          <div className="rule-brass mt-12 w-40" />
        </Reveal>
      </div>
    </section>
  );
}
