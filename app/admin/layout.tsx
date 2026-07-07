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

// applies the saved theme before first paint so the portal never flashes
const themeBoot = `try{var t=localStorage.getItem("beka-portal-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${cormorant.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body min-h-svh bg-(--p-bg) text-(--p-text) antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <PortalChrome>{children}</PortalChrome>
      </body>
    </html>
  );
}
