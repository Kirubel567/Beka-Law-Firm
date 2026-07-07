"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "@/lib/cms/types";

export default function SiteForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [heroImage, setHeroImage] = useState(initial.heroImage ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string; error?: string };
    if (res.ok && data.url) {
      setHeroImage(data.url);
    } else {
      setMsg(data.error ?? "Upload failed.");
    }
    setUploading(false);
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, email, heroImage: heroImage || null }),
    });
    setBusy(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
    router.refresh();
  };

  const input =
    "w-full border border-(--p-border-2) bg-(--p-input) px-4 py-3 text-sm text-(--p-text) focus:border-(--p-accent-2) focus:outline-none transition-colors";
  const labelCls = "label-caps mb-1.5 block text-(--p-text-3)";

  return (
    <div className="mt-8 max-w-2xl space-y-8">
      <div>
        <span className={labelCls}>Homepage hero image</span>
        {heroImage ? (
          <div className="border border-(--p-border-2)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="Hero preview" className="max-h-64 w-full object-cover" />
            <div className="flex items-center justify-between px-4 py-3">
              <span className="truncate text-xs text-(--p-text-3)">{heroImage}</span>
              <button
                type="button"
                onClick={() => setHeroImage("")}
                className="label-caps text-(--p-alert)"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <p className="mb-3 text-xs text-(--p-text-4)">
            No image set — the hero uses the carved-seal design. An uploaded
            photograph appears behind it with a basalt overlay.
          </p>
        )}
        <label className="mt-3 inline-block cursor-pointer border border-(--p-border-2) px-5 py-3 text-[0.7rem] tracking-[0.18em] text-(--p-text-2) uppercase transition-colors hover:border-(--p-accent-2) hover:text-(--p-accent)">
          {uploading ? "Uploading…" : heroImage ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div>
        <label htmlFor="site-phone" className={labelCls}>
          Telephone
        </label>
        <input
          id="site-phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+251 11 …"
          className={input}
        />
      </div>

      <div>
        <label htmlFor="site-email" className={labelCls}>
          Email
        </label>
        <input
          id="site-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="info@bekalawfirm.com"
          className={input}
        />
      </div>

      {msg && <p className="text-sm text-(--p-accent)">{msg}</p>}

      <button
        type="button"
        disabled={busy || uploading}
        onClick={save}
        className="border border-(--p-accent-2) px-7 py-3.5 text-[0.72rem] tracking-[0.22em] text-(--p-accent) uppercase transition-colors hover:bg-(--p-hover) disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
