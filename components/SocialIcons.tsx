/**
 * Hairline social glyphs, drawn to the same 1.1px line weight as the portal
 * icon set so they sit quietly in the footer rather than shouting as brand chips.
 */
import type { ReactNode } from "react";

type P = { className?: string };

const svg = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
};

function LinkedIn({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10v7M7 7v0M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" />
    </svg>
  );
}
function Facebook({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <path d="M14 8h2M13 21v-9a2 2 0 0 1 2-2M10 13h4" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
function X({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}
function Instagram({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </svg>
  );
}
function Telegram({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <path d="M21 5L3 12l5 2 2 5 3-4 4 3z" />
      <path d="M8 14l8-6" />
    </svg>
  );
}
function YouTube({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M11 9.5l4 2.5-4 2.5z" />
    </svg>
  );
}
function TikTok({ className }: P) {
  return (
    <svg {...svg} className={className}>
      <path d="M10 8v7a3 3 0 1 1-3-3M10 8c1 2 2.5 3 4 3M14 5c0 2 1 3 3 3" />
    </svg>
  );
}

const ICONS: Record<string, (p: P) => ReactNode> = {
  linkedin: LinkedIn,
  facebook: Facebook,
  x: X,
  instagram: Instagram,
  telegram: Telegram,
  youtube: YouTube,
  tiktok: TikTok,
};

const LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  telegram: "Telegram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = ICONS[platform];
  return Icon ? <Icon className={className} /> : null;
}

export function socialLabel(platform: string): string {
  return LABEL[platform] ?? platform;
}
