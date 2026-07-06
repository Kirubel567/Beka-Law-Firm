"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collections } from "@/lib/cms/schema";
import { SealMark } from "@/components/Motifs";
import {
  IconArticle,
  IconDashboard,
  IconExternal,
  IconInbox,
  IconMatter,
  IconPerson,
  IconQuote,
  IconSettings,
} from "./icons";

interface Stats {
  collections: Record<string, { total: number; drafts: number }>;
  inquiries: number;
}

const collectionIcons: Record<string, (p: { className?: string }) => ReactNode> = {
  articles: IconArticle,
  people: IconPerson,
  matters: IconMatter,
  testimonials: IconQuote,
};

/**
 * The portal shell — grouped sidebar with live counts and a jump-to filter,
 * a slim top bar, and the working canvas. The login screen renders bare.
 */
export default function PortalChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    setMobileOpen(false);
    if (isLogin) return;
    let cancelled = false;
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setStats(d as Stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, isLogin]);

  const groups = useMemo(() => {
    return [
      {
        label: "Overview",
        items: [
          { href: "/admin", label: "Dashboard", icon: IconDashboard, count: null as number | null, drafts: 0, external: false },
        ],
      },
      {
        label: "Content",
        items: collections.map((c) => ({
          href: `/admin/${c.slug}`,
          label: c.label,
          icon: collectionIcons[c.slug] ?? IconArticle,
          count: stats?.collections[c.slug]?.total ?? null,
          drafts: stats?.collections[c.slug]?.drafts ?? 0,
          external: false,
        })),
      },
      {
        label: "Correspondence",
        items: [
          { href: "/admin/inquiries", label: "Inquiries", icon: IconInbox, count: stats?.inquiries ?? null, drafts: 0, external: false },
        ],
      },
      {
        label: "Site",
        items: [
          { href: "/admin/site", label: "Hero & contact details", icon: IconSettings, count: null, drafts: 0, external: false },
          { href: "/en", label: "View public site", icon: IconExternal, count: null, drafts: 0, external: true },
        ],
      },
    ];
  }, [stats]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, filter]);

  const pageTitle = useMemo(() => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname === "/admin/site") return "Site settings";
    if (pathname === "/admin/inquiries") return "Inquiries";
    const seg = pathname.split("/")[2];
    const col = collections.find((c) => c.slug === seg);
    if (col) return pathname.split("/").length > 3 ? `${col.label} · Editor` : col.label;
    return "Portal";
  }, [pathname]);

  if (isLogin) {
    return <main className="mx-auto min-h-svh max-w-6xl px-5 py-10">{children}</main>;
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 pt-6 pb-5">
        <SealMark className="h-9 w-9 shrink-0 text-brass-400" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-medium tracking-[0.16em] text-parchment-50">BEKA</span>
          <span className="label-caps mt-1 text-[0.55rem] text-brass-400/80">Staff Portal</span>
        </span>
      </Link>

      <div className="px-5 pb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Jump to…"
          className="w-full border border-parchment-100/10 bg-basalt-950 px-3 py-2 text-xs text-parchment-100 placeholder:text-parchment-200/30 focus:border-brass-400/60 focus:outline-none"
        />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Portal">
        {filtered.map((g) => (
          <div key={g.label}>
            <p className="label-caps px-2 pb-2 text-[0.6rem] text-parchment-200/35">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = !item.external && isActive(item.href);
                return (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      className={`group flex items-center gap-3 px-2 py-2 text-[0.8rem] transition-colors ${
                        active
                          ? "border-l-2 border-brass-400 bg-basalt-800 pl-[calc(0.5rem-2px)] text-brass-300"
                          : "text-parchment-200/70 hover:bg-basalt-800/60 hover:text-parchment-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brass-400" : "text-parchment-200/40 group-hover:text-brass-400/70"}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.drafts > 0 && (
                        <span className="label-caps text-[0.55rem] text-terracotta-500">{item.drafts} draft{item.drafts > 1 ? "s" : ""}</span>
                      )}
                      {item.count !== null && (
                        <span className="label-caps text-[0.6rem] text-parchment-200/35 tabular-nums">{item.count}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-parchment-100/10 px-5 py-4">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.assign("/admin/login");
          }}
          className="label-caps text-parchment-200/50 transition-colors hover:text-brass-300"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh">
      {/* sidebar — fixed on desktop, sliding sheet on small screens */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-parchment-100/10 bg-basalt-900 lg:block">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-basalt-950/70"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-parchment-100/10 bg-basalt-900">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-parchment-100/10 bg-basalt-950/95 px-5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="label-caps text-parchment-200/70 lg:hidden"
            >
              Menu
            </button>
            <h1 className="label-caps text-parchment-200/70">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {(["en", "am", "om"] as const).map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                target="_blank"
                className="label-caps text-[0.6rem] text-parchment-200/40 transition-colors hover:text-brass-300"
              >
                {l === "om" ? "OR" : l.toUpperCase()} ↗
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
