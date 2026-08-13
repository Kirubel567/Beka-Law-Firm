"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings, SocialLink } from "@/lib/cms/types";

const PLATFORMS = ["linkedin", "facebook", "x", "instagram", "telegram", "youtube", "tiktok"] as const;
const PLATFORM_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  x: "X (Twitter)",
  instagram: "Instagram",
  telegram: "Telegram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export default function SiteForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [heroImages, setHeroImages] = useState<string[]>(
    initial.heroImages && initial.heroImages.length > 0
      ? initial.heroImages
      : initial.heroImage
        ? [initial.heroImage]
        : [],
  );
  const [intervalSec, setIntervalSec] = useState<number>(initial.heroIntervalSec ?? 6);
  const [social, setSocial] = useState<SocialLink[]>(initial.social ?? []);
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
      setHeroImages((imgs) => (imgs.includes(data.url!) ? imgs : [...imgs, data.url!]));
    } else {
      setMsg(data.error ?? "Upload failed.");
    }
    setUploading(false);
  };

  const removeImage = (url: string) => setHeroImages((imgs) => imgs.filter((i) => i !== url));

  const addSocial = () => setSocial((s) => [...s, { platform: "linkedin", url: "" }]);
  const updateSocial = (i: number, patch: Partial<SocialLink>) =>
    setSocial((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeSocial = (i: number) => setSocial((s) => s.filter((_, idx) => idx !== i));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        email,
        heroImages,
        heroIntervalSec: intervalSec,
        social: social.filter((s) => s.url.trim() !== ""),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("Saved.");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? "Save failed.");
    }
  };

  const input =
    "w-full border border-(--p-border-2) bg-(--p-input) px-4 py-3 text-sm text-(--p-text) focus:border-(--p-accent-2) focus:outline-none transition-colors";
  const labelCls = "label-caps mb-1.5 block text-(--p-text-3)";

  return (
    <div className="mt-8 max-w-2xl space-y-9">
      {/* ——— Hero images (shuffleable) ——— */}
      <div>
        <span className={labelCls}>Homepage hero images</span>
        <p className="mb-3 text-xs text-(--p-text-4)">
          Add one or more photographs. With several, the hero crossfades
          between them. Each appears behind the same basalt overlay, so the
          register never changes.
        </p>

        {heroImages.length > 0 && (
          <ul className="mb-3 space-y-2">
            {heroImages.map((url, i) => (
              <li key={url} className="flex items-center gap-3 border border-(--p-border-2)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-24 shrink-0 object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs text-(--p-text-3)">
                  {i + 1}. {url}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="label-caps px-4 text-(--p-alert)"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="inline-block cursor-pointer border border-(--p-border-2) px-5 py-3 text-[0.7rem] tracking-[0.18em] text-(--p-text-2) uppercase transition-colors hover:border-(--p-accent-2) hover:text-(--p-accent)">
          {uploading ? "Uploading…" : heroImages.length > 0 ? "Add another image" : "Upload image"}
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

      {/* ——— Shuffle interval ——— */}
      <div>
        <label htmlFor="hero-interval" className={labelCls}>
          Seconds per image
        </label>
        <input
          id="hero-interval"
          type="number"
          min={2}
          max={120}
          value={intervalSec}
          onChange={(e) => setIntervalSec(Number(e.target.value))}
          className={`${input} max-w-40`}
        />
        <p className="mt-1.5 text-xs text-(--p-text-4)">
          How long each image stays before the next fades in (2–120s; default 6).
          Only applies when more than one image is set.
        </p>
      </div>

      <div className="border-t border-(--p-border)" />

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

      {/* ——— Social links ——— */}
      <div>
        <span className={labelCls}>Social media</span>
        <p className="mb-3 text-xs text-(--p-text-4)">
          The firm&apos;s public profiles, shown as icons in the site footer.
        </p>

        {social.length > 0 && (
          <ul className="mb-3 space-y-2">
            {social.map((row, i) => (
              <li key={i} className="flex items-center gap-2">
                <select
                  value={row.platform}
                  onChange={(e) => updateSocial(i, { platform: e.target.value })}
                  className={`${input} max-w-44`}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={row.url}
                  onChange={(e) => updateSocial(i, { url: e.target.value })}
                  placeholder="https://…"
                  className={input}
                />
                <button
                  type="button"
                  onClick={() => removeSocial(i)}
                  className="label-caps shrink-0 px-3 text-(--p-alert)"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addSocial}
          className="label-caps border border-(--p-border-2) px-4 py-2 text-(--p-text-2) transition-colors hover:border-(--p-accent-2) hover:text-(--p-accent)"
        >
          + Add social link
        </button>
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
