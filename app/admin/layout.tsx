import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "../globals.css";
import { SealMark } from "@/components/Motifs";
import LogoutButton from "@/components/admin/LogoutButton";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Staff Portal — BEKA", template: "%s — BEKA Portal" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body className="font-body min-h-svh bg-basalt-950 text-parchment-100 antialiased">
        <header className="border-b border-parchment-100/10 bg-basalt-900">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/admin" className="flex items-center gap-3">
              <SealMark className="h-8 w-8 text-brass-400" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-medium tracking-[0.16em]">BEKA</span>
                <span className="label-caps mt-0.5 text-[0.55rem] text-brass-400/80">
                  Staff Portal
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/en" className="link-quiet text-xs text-parchment-200/70" target="_blank">
                View site ↗
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      </body>
    </html>
  );
}
