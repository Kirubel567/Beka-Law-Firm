"use client";

import { usePathname } from "next/navigation";

export default function LogoutButton() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.assign("/admin/login");
      }}
      className="label-caps text-parchment-200/70 transition-colors hover:text-brass-300"
    >
      Sign out
    </button>
  );
}
