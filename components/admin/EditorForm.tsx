"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CmsItem, CollectionDef, FieldDef } from "@/lib/cms/types";
import type { Locale } from "@/lib/content/types";

const LOCALES: { key: Locale; label: string; note: string }[] = [
  { key: "en", label: "English", note: "Base language — other languages fall back to it field by field." },
  { key: "am", label: "አማርኛ", note: "Amharic. Leave a field empty to fall back to English." },
  { key: "om", label: "Afaan Oromoo", note: "Oromo. Leave a field empty to fall back to English." },
];

/* ——— value <-> textarea serialization per field type ——— */

function toText(value: unknown, type: FieldDef["type"]): string {
  if (value == null) return "";
  switch (type) {
    case "paragraphs":
      return Array.isArray(value) ? value.join("\n\n") : String(value);
    case "lines":
      return Array.isArray(value) ? value.join("\n") : String(value);
    case "pairs":
      return Array.isArray(value)
        ? (value as [string, string][]).map(([k, v]) => `${k} | ${v}`).join("\n")
        : String(value);
    default:
      return String(value);
  }
}

function fromText(text: string, type: FieldDef["type"]): unknown {
  const trimmed = text.trim();
  switch (type) {
    case "paragraphs":
      return trimmed === "" ? [] : trimmed.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim());
    case "lines":
      return trimmed === "" ? [] : trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    case "pairs":
      return trimmed === ""
        ? []
        : trimmed
            .split("\n")
            .map((l) => l.split("|").map((s) => s.trim()))
            .filter((p) => p.length >= 2 && p[0])
            .map((p) => [p[0], p.slice(1).join(" | ")]);
    default:
      return trimmed;
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

export default function EditorForm({
  def,
  item,
}: {
  def: CollectionDef;
  item: CmsItem | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Locale>("en");
  const [status, setStatus] = useState(item?.status ?? "draft");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [date, setDate] = useState(item?.date ?? new Date().toISOString().slice(0, 10));
  const [order, setOrder] = useState(item?.order ?? 99);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState<Record<Locale, Record<string, string>>>(() => {
    const initial = {} as Record<Locale, Record<string, string>>;
    for (const { key } of LOCALES) {
      const src = (item?.locales?.[key] ?? {}) as Record<string, unknown>;
      initial[key] = Object.fromEntries(
        def.fields.map((f) => [f.name, toText(src[f.name], f.type)]),
      );
    }
    return initial;
  });

  const setField = (locale: Locale, name: string, value: string) =>
    setText((t) => ({ ...t, [locale]: { ...t[locale], [name]: value } }));

  const save = async () => {
    setBusy(true);
    setError(null);
    const locales = Object.fromEntries(
      LOCALES.map(({ key }) => [
        key,
        Object.fromEntries(def.fields.map((f) => [f.name, fromText(text[key][f.name] ?? "", f.type)])),
      ]),
    );
    const finalSlug = def.hasSlug
      ? slug.trim() || slugify(text.en[def.titleField] ?? "")
      : undefined;
    const payload = {
      status,
      order: Number(order) || 99,
      slug: finalSlug,
      date: def.hasDate ? date : undefined,
      locales,
    };
    const res = item
      ? await fetch(`/api/admin/collections/${def.slug}/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/collections/${def.slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res.ok) {
      router.push(`/admin/${def.slug}`);
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Save failed.");
      setBusy(false);
    }
  };

  const input =
    "w-full border border-parchment-100/15 bg-basalt-950 px-4 py-3 text-sm text-parchment-100 focus:border-brass-400 focus:outline-none transition-colors";
  const labelCls = "label-caps mb-1.5 block text-parchment-200/60";

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_16rem]">
      <div>
        {/* language tabs — the translation workflow */}
        <div className="flex border-b border-parchment-100/15">
          {LOCALES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm transition-colors ${
                tab === key
                  ? "border-b-2 border-brass-400 text-brass-300"
                  : "text-parchment-200/50 hover:text-parchment-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-parchment-200/40">
          {LOCALES.find((l) => l.key === tab)?.note}
        </p>

        <div className="mt-6 space-y-7" lang={tab}>
          {def.fields.map((f) => (
            <div key={`${tab}-${f.name}`}>
              <label htmlFor={`f-${tab}-${f.name}`} className={labelCls}>
                {f.label}
                {f.required && tab === "en" && <span className="text-terracotta-500"> *</span>}
              </label>
              {f.type === "text" ? (
                <input
                  id={`f-${tab}-${f.name}`}
                  type="text"
                  value={text[tab][f.name] ?? ""}
                  onChange={(e) => setField(tab, f.name, e.target.value)}
                  className={input}
                />
              ) : (
                <textarea
                  id={`f-${tab}-${f.name}`}
                  rows={f.type === "paragraphs" ? 10 : f.type === "textarea" ? 4 : 5}
                  value={text[tab][f.name] ?? ""}
                  onChange={(e) => setField(tab, f.name, e.target.value)}
                  className={`${input} resize-y leading-relaxed`}
                />
              )}
              {f.hint && <p className="mt-1.5 text-xs text-parchment-200/40">{f.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* publishing sidebar */}
      <aside className="h-fit space-y-6 border border-parchment-100/10 bg-basalt-900 p-6">
        <div>
          <span className={labelCls}>Status</span>
          <div className="flex gap-2">
            {(["draft", "published"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 border px-3 py-2 text-[0.68rem] tracking-[0.15em] uppercase transition-colors ${
                  status === s
                    ? "border-brass-400 bg-brass-400/10 text-brass-300"
                    : "border-parchment-100/15 text-parchment-200/50 hover:text-parchment-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-parchment-200/40">
            Drafts are visible only here — never on the public site.
          </p>
        </div>

        {def.hasSlug && (
          <div>
            <label htmlFor="meta-slug" className={labelCls}>
              URL slug
            </label>
            <input
              id="meta-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="auto from English title"
              className={input}
            />
          </div>
        )}

        {def.hasDate && (
          <div>
            <label htmlFor="meta-date" className={labelCls}>
              Date
            </label>
            <input
              id="meta-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={input}
            />
          </div>
        )}

        <div>
          <label htmlFor="meta-order" className={labelCls}>
            Order
          </label>
          <input
            id="meta-order"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className={input}
          />
        </div>

        {error && <p className="text-sm text-terracotta-500">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="w-full border border-brass-500/70 px-5 py-3.5 text-[0.72rem] tracking-[0.22em] text-brass-300 uppercase transition-colors hover:bg-brass-400/10 disabled:opacity-50"
        >
          {busy ? "Saving…" : item ? "Save changes" : "Create entry"}
        </button>
      </aside>
    </div>
  );
}
