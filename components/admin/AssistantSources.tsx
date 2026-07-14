"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssistantSource, SourceStatus } from "@/lib/assistant/types";

async function errorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Request failed (${response.status})`;
}

export default function AssistantSources() {
  const [sources, setSources] = useState<AssistantSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/assistant/sources", { cache: "no-store" });
      if (!response.ok) throw new Error(await errorMessage(response));
      setSources((await response.json()) as AssistantSource[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncSite = async () => {
    setWorking("sync");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/assistant/sync-site", { method: "POST" });
      if (!response.ok) throw new Error(await errorMessage(response));
      const body = (await response.json()) as { synced: number };
      setNotice(`Synchronized ${body.synced} published English website pages.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Website sync failed");
    } finally {
      setWorking(null);
    }
  };

  const upload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorking("upload");
    setError(null);
    setNotice(null);
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/admin/assistant/sources", {
        method: "POST",
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      form.reset();
      setNotice("Source parsed and indexed. Review it, then approve it for public retrieval.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed");
    } finally {
      setWorking(null);
    }
  };

  const setStatus = async (source: AssistantSource, status: SourceStatus) => {
    setWorking(source.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/assistant/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publication_status: status }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status update failed");
    } finally {
      setWorking(null);
    }
  };

  const reindex = async (source: AssistantSource) => {
    setWorking(source.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/assistant/sources/${source.id}/reindex`, { method: "POST" });
      if (!response.ok) throw new Error(await errorMessage(response));
      setNotice(`Reindexed “${source.title}”.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Reindex failed");
    } finally {
      setWorking(null);
    }
  };

  const remove = async (source: AssistantSource) => {
    if (!window.confirm(`Remove “${source.title}” from the assistant corpus?`)) return;
    setWorking(source.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/assistant/sources/${source.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await errorMessage(response));
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="border border-(--p-border) bg-(--p-panel) p-7 md:p-9">
        <p className="label-caps text-(--p-accent)">Legal Information Assistant · Corpus</p>
        <h2 className="mt-3 font-display text-4xl font-medium text-(--p-text)">Approved public sources only.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-(--p-text-3)">
          Synchronize the published English website or add a curated English public legal source.
          Uploaded files remain pending until an administrator approves them. Never upload client,
          matter, privileged, confidential, or internal firm documents here.
        </p>
        <button
          type="button"
          onClick={() => void syncSite()}
          disabled={working !== null}
          className="label-caps mt-6 border border-(--p-accent-2) px-4 py-2.5 text-(--p-accent) hover:bg-(--p-hover) disabled:opacity-50"
        >
          {working === "sync" ? "Synchronizing…" : "Synchronize published website"}
        </button>
      </section>

      <form onSubmit={upload} className="border border-(--p-border) bg-(--p-panel) p-7">
        <h3 className="font-display text-2xl text-(--p-text)">Add a curated public legal source</h3>
        <p className="mt-2 text-xs text-(--p-text-4)">English PDF, DOCX, TXT or Markdown · maximum 20 MB</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-xs text-(--p-text-3)">
            Source title *
            <input name="title" required minLength={2} maxLength={240} className="mt-2 w-full border border-(--p-border) bg-(--p-input) px-3 py-2.5 text-sm text-(--p-text) outline-none focus:border-(--p-accent-2)" />
          </label>
          <label className="text-xs text-(--p-text-3)">
            English source file *
            <input name="file" type="file" required accept=".pdf,.docx,.txt,.md" className="mt-2 block w-full text-sm text-(--p-text-2) file:mr-3 file:border file:border-(--p-border) file:bg-(--p-hover) file:px-3 file:py-2 file:text-(--p-text)" />
          </label>
          <label className="text-xs text-(--p-text-3)">
            Canonical public URL
            <input name="canonical_url" type="url" maxLength={2000} className="mt-2 w-full border border-(--p-border) bg-(--p-input) px-3 py-2.5 text-sm text-(--p-text) outline-none focus:border-(--p-accent-2)" />
          </label>
          <label className="text-xs text-(--p-text-3)">
            Issuing authority
            <input name="issuer" maxLength={160} className="mt-2 w-full border border-(--p-border) bg-(--p-input) px-3 py-2.5 text-sm text-(--p-text) outline-none focus:border-(--p-accent-2)" />
          </label>
          <label className="text-xs text-(--p-text-3)">
            Jurisdiction
            <input name="jurisdiction" maxLength={120} defaultValue="Ethiopia" className="mt-2 w-full border border-(--p-border) bg-(--p-input) px-3 py-2.5 text-sm text-(--p-text) outline-none focus:border-(--p-accent-2)" />
          </label>
        </div>
        <button type="submit" disabled={working !== null} className="label-caps mt-6 bg-(--p-accent) px-5 py-3 text-(--p-bg) disabled:opacity-50">
          {working === "upload" ? "Parsing and embedding…" : "Upload as pending"}
        </button>
      </form>

      {(error || notice) && (
        <p className={`border px-4 py-3 text-sm ${error ? "border-(--p-alert) text-(--p-alert)" : "border-(--p-accent-2) text-(--p-accent)"}`} role="status">
          {error ?? notice}
        </p>
      )}

      <section>
        <div className="flex items-baseline gap-4">
          <h3 className="label-caps text-(--p-accent-2)">Sources</h3>
          <span className="h-px flex-1 bg-(--p-border)" />
          <span className="text-xs text-(--p-text-4)">{sources.length}</span>
        </div>
        {loading ? (
          <p className="mt-5 text-sm text-(--p-text-3)">Loading sources…</p>
        ) : sources.length === 0 ? (
          <p className="mt-5 border border-(--p-border) bg-(--p-panel) p-6 text-sm text-(--p-text-3)">No corpus sources yet. Synchronize the website to begin.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {sources.map((source) => (
              <article key={source.id} className="border border-(--p-border) bg-(--p-panel) p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`label-caps border px-2 py-1 text-[0.55rem] ${source.publication_status === "approved" ? "border-(--p-accent-2) text-(--p-accent)" : source.publication_status === "rejected" ? "border-(--p-alert) text-(--p-alert)" : "border-(--p-border-2) text-(--p-text-3)"}`}>
                        {source.publication_status}
                      </span>
                      <span className="label-caps text-[0.55rem] text-(--p-text-4)">{source.kind === "website" ? "website" : source.media_type}</span>
                    </div>
                    <h4 className="mt-3 font-display text-xl text-(--p-text)">{source.title}</h4>
                    <p className="mt-2 text-xs text-(--p-text-4)">{source.chunk_count} chunks · updated {new Date(source.updated_at).toLocaleString()}</p>
                    {source.canonical_url && <a href={source.canonical_url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-(--p-accent-2) hover:text-(--p-accent)">{source.canonical_url} ↗</a>}
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {source.publication_status !== "approved" && <button type="button" disabled={working !== null} onClick={() => void setStatus(source, "approved")} className="border border-(--p-accent-2) px-3 py-2 text-xs text-(--p-accent)">Approve</button>}
                    {source.publication_status !== "rejected" && source.kind !== "website" && <button type="button" disabled={working !== null} onClick={() => void setStatus(source, "rejected")} className="border border-(--p-border) px-3 py-2 text-xs text-(--p-text-3)">Reject</button>}
                    <button type="button" disabled={working !== null} onClick={() => void reindex(source)} className="border border-(--p-border) px-3 py-2 text-xs text-(--p-text-3)">Reindex</button>
                    <button type="button" disabled={working !== null} onClick={() => void remove(source)} className="border border-(--p-alert) px-3 py-2 text-xs text-(--p-alert)">Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
