/**
 * Line-art motifs derived from processional-cross and telsem knot geometry,
 * reduced to hairline abstraction. Used as section punctuation, never costume.
 */

export function SealMark({
  className = "",
  stroke = "currentColor",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="45" stroke={stroke} strokeWidth="1" />
      <circle cx="48" cy="48" r="37" stroke={stroke} strokeWidth="0.6" opacity="0.6" />
      <rect x="30" y="30" width="36" height="36" transform="rotate(45 48 48)" stroke={stroke} strokeWidth="0.8" />
      <path d="M48 20v56M20 48h56" stroke={stroke} strokeWidth="0.8" />
      <path d="M48 34l6 14-6 14-6-14z" stroke={stroke} strokeWidth="0.9" />
      <circle cx="48" cy="48" r="4" stroke={stroke} strokeWidth="0.9" />
      <circle cx="48" cy="14" r="1.6" fill={stroke} />
      <circle cx="48" cy="82" r="1.6" fill={stroke} />
      <circle cx="14" cy="48" r="1.6" fill={stroke} />
      <circle cx="82" cy="48" r="1.6" fill={stroke} />
    </svg>
  );
}

export function ThreadDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 24"
      fill="none"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M0 12h128c8 0 10-8 16-8s8 16 16 16 8-16 16-16 8 8 16 8h128"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="160" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <SealMark className="h-9 w-9 shrink-0 text-brass-400" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] font-medium tracking-[0.18em]">BEKA</span>
        <span className="label-caps mt-1 text-[0.55rem] opacity-70">Belay Ketema &amp; Partners LLP</span>
      </span>
    </span>
  );
}
