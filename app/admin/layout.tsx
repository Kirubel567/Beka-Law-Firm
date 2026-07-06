import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "../globals.css";
import PortalChrome from "@/components/admin/PortalChrome";

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
        <PortalChrome>{children}</PortalChrome>
      </body>
    </html>
  );
}
