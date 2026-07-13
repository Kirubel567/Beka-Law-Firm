"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collections } from "@/lib/cms/schema";
import { BekaMark } from "@/components/Motifs";
import {
  IconArticle,
  IconClose,
  IconDashboard,
  IconExternal,
  IconHistory,
  IconInbox,
  IconMatter,
  IconMenu,
  IconMoon,
  IconPerson,
  IconQuote,
  IconSettings,
  IconSun,
  IconUsers,
} from "./icons";

interface Stats {
  collections: Record<string, { total: number; drafts: number }>;
  inquiries: number;
}

interface Me {
  username: string;
  displayName: string;
  role: "admin" | "editor";
}

const collectionIcons: Record<string, (p: { className?: string }) => ReactNode> = {
  articles: IconArticle,
  people: IconPerson,
  matters: IconMatter,
  testimonials: IconQuote,
};

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") === "light") {
      setTheme("light");
    }
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("beka-portal-theme", next);
    } catch {
      /* private browsing — the choice just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className="flex h-8 w-8 items-center justify-center border border-(--p-border) text-(--p-text-3) transition-colors hover:border-(--p-accent-2) hover:text-(--p-accent)"
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}

/**
 * The portal shell — grouped sidebar with live counts and a jump-to filter,
 * a slim top bar with the theme toggle, and the working canvas.
 * The login screen renders bare.
 */
export default function PortalChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Me | null>(null);
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

  useEffect(() => {
    if (isLogin) return;
    let cancelled = false;
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setMe(d as Me);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLogin]);

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
      ...(me?.role === "admin"
        ? [
            {
              label: "Administration",
              items: [
                { href: "/admin/users", label: "Staff accounts", icon: IconUsers, count: null as number | null, drafts: 0, external: false },
                { href: "/admin/audit", label: "Activity log", icon: IconHistory, count: null as number | null, drafts: 0, external: false },
              ],
            },
          ]
        : []),
    ];
  }, [stats, me]);

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
    if (pathname === "/admin/users") return "Staff accounts";
    if (pathname === "/admin/audit") return "Activity log";
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
        <BekaMark className="h-9 w-auto shrink-0" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-medium tracking-[0.16em] text-(--p-text)">BEKA</span>
          <span className="label-caps mt-1 text-[0.55rem] text-(--p-accent-2)">Staff Portal</span>
        </span>
      </Link>

      <div className="px-5 pb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Jump to…"
          className="w-full border border-(--p-border) bg-(--p-input) px-3 py-2 text-xs text-(--p-text) placeholder:text-(--p-text-4) focus:border-(--p-accent-2) focus:outline-none"
        />
      </div>

      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Portal">
        {filtered.map((g) => (
          <div key={g.label}>
            <p className="label-caps px-2 pb-2 text-[0.6rem] text-(--p-text-4)">{g.label}</p>
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
                          ? "border-l-2 border-(--p-accent) bg-(--p-hover) pl-[calc(0.5rem-2px)] text-(--p-accent)"
                          : "text-(--p-text-2) hover:bg-(--p-hover) hover:text-(--p-text)"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-(--p-accent)" : "text-(--p-text-4) group-hover:text-(--p-accent-2)"}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.drafts > 0 && (
                        <span className="label-caps text-[0.55rem] text-(--p-alert)">{item.drafts} draft{item.drafts > 1 ? "s" : ""}</span>
                      )}
                      {item.count !== null && (
                        <span className="label-caps text-[0.6rem] text-(--p-text-4) tabular-nums">{item.count}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-3 border-t border-(--p-border) px-5 py-4">
        {me && (
          <span className="min-w-0 truncate text-xs text-(--p-text-3)" title={me.username}>
            {me.displayName || me.username}
            <span className="label-caps ml-2 text-[0.55rem] text-(--p-text-4)">{me.role}</span>
          </span>
        )}
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.assign("/admin/login");
          }}
          className="label-caps shrink-0 text-(--p-text-3) transition-colors hover:text-(--p-accent)"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh">
      {/* sidebar — fixed on desktop, sliding sheet on small screens */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-(--p-border) bg-(--p-panel) lg:block">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Dismiss menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-(--p-scrim)"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-(--p-border) bg-(--p-panel)">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 right-3 flex h-9 w-9 items-center justify-center text-(--p-text-3) transition-colors hover:text-(--p-accent)"
            >
              <IconClose />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-(--p-border) bg-(--p-topbar) px-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-ml-2 flex h-9 w-9 items-center justify-center text-(--p-text-2) transition-colors hover:text-(--p-accent) lg:hidden"
            >
              <IconMenu />
            </button>
            <h1 className="label-caps hidden text-(--p-text-2) lg:block">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {(["en", "am", "om"] as const).map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                target="_blank"
                className="label-caps text-[0.6rem] text-(--p-text-4) transition-colors hover:text-(--p-accent)"
              >
                {l === "om" ? "OR" : l.toUpperCase()} ↗
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
