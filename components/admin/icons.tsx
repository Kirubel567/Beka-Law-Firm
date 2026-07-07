/** Hairline icon set for the portal — drawn to match the seal's line weight. */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type P = { className?: string };

export function IconDashboard({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" />
      <rect x="11" y="3" width="6" height="6" />
      <rect x="3" y="11" width="6" height="6" />
      <rect x="11" y="11" width="6" height="6" />
    </svg>
  );
}

export function IconArticle({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M5 3h10v14H5z" />
      <path d="M8 7h4M8 10h4M8 13h2.5" />
    </svg>
  );
}

export function IconPerson({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <circle cx="10" cy="7" r="3" />
      <path d="M4.5 17c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
    </svg>
  );
}

export function IconMatter({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M3 6h5l1.5 2H17v8H3z" />
      <path d="M3 6V4h6" />
    </svg>
  );
}

export function IconQuote({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M5 12a3 3 0 1 1 3-3v2.5A4.5 4.5 0 0 1 3.5 16" />
      <path d="M12.5 12a3 3 0 1 1 3-3v2.5A4.5 4.5 0 0 1 11 16" />
    </svg>
  );
}

export function IconInbox({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M3 11l2.5-6h9L17 11v5H3z" />
      <path d="M3 11h4l1.5 2h3L13 11h4" />
    </svg>
  );
}

export function IconSettings({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M4 6h12M4 10h12M4 14h12" />
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="13" cy="10" r="1.6" />
      <circle cx="6" cy="14" r="1.6" />
    </svg>
  );
}

export function IconExternal({ className = "h-3.5 w-3.5" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M8 5H4v11h11v-4" />
      <path d="M10 10l6-6M11 4h5v5" />
    </svg>
  );
}

export function IconPlus({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function IconSun({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" />
    </svg>
  );
}

export function IconMoon({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M16 12.5A7 7 0 0 1 7.5 4 7 7 0 1 0 16 12.5z" />
    </svg>
  );
}
