"use client";

import { useState } from "react";
import type { PortalUser } from "@/lib/users";

const field =
  "w-full border border-(--p-border) bg-(--p-input) px-3 py-2 text-sm text-(--p-text) placeholder:text-(--p-text-4) focus:border-(--p-accent-2) focus:outline-none";

const smallBtn =
  "label-caps border border-(--p-border) px-3 py-1.5 text-[0.6rem] text-(--p-text-3) transition-colors hover:border-(--p-accent-2) hover:text-(--p-accent) disabled:opacity-40";

export default function UsersManager({
  initialUsers,
  meId,
}: {
  initialUsers: PortalUser[];
  meId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()) as PortalUser[]);
  };

  const say = (err: string | null, note: string | null = null) => {
    setError(err);
    setNotice(note);
  };

  const call = async (fn: () => Promise<Response>, okNote: string) => {
    setBusy(true);
    say(null);
    try {
      const res = await fn();
      if (res.ok) {
        await refresh();
        say(null, okNote);
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        say(data?.error ?? "Request failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    await call(
      () =>
        fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.get("username"),
            displayName: form.get("displayName"),
            password: form.get("password"),
            role: form.get("role"),
          }),
        }),
      "Account created.",
    );
    el.reset();
  };

  const patch = (id: string, body: Record<string, unknown>, okNote: string) =>
    call(
      () =>
        fetch(`/api/admin/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      okNote,
    );

  const onResetPassword = (u: PortalUser) => {
    const pw = window.prompt(`New password for ${u.username} (min 10 characters):`);
    if (!pw) return;
    void patch(u.id, { password: pw }, `Password reset for ${u.username} — they are signed out everywhere.`);
  };

  const onDelete = (u: PortalUser) => {
    if (!window.confirm(`Delete the account “${u.username}”? This cannot be undone.`)) return;
    void call(
      () => fetch(`/api/admin/users/${u.id}`, { method: "DELETE" }),
      `Account ${u.username} deleted.`,
    );
  };

  return (
    <div className="mt-8 space-y-8">
      {(error || notice) && (
        <p
          className={`border p-4 text-sm ${
            error
              ? "border-(--p-alert) text-(--p-alert)"
              : "border-(--p-border) text-(--p-text-2)"
          }`}
        >
          {error ?? notice}
        </p>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <article
            key={u.id}
            className={`flex flex-wrap items-center gap-x-5 gap-y-3 border border-(--p-border) bg-(--p-panel) p-5 ${u.disabled ? "opacity-60" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-(--p-text)">
                {u.displayName || u.username}
                {u.id === meId && <span className="ml-2 text-xs text-(--p-text-4)">(you)</span>}
              </p>
              <p className="label-caps mt-1 text-[0.6rem] text-(--p-text-4)">
                @{u.username} · since {u.createdAt.slice(0, 10)}
                {u.disabled ? " · disabled" : ""}
              </p>
            </div>
            <span
              className={`label-caps text-[0.6rem] ${u.role === "admin" ? "text-(--p-accent)" : "text-(--p-text-3)"}`}
            >
              {u.role}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch(
                    u.id,
                    { role: u.role === "admin" ? "editor" : "admin" },
                    `${u.username} is now ${u.role === "admin" ? "an editor" : "an administrator"}.`,
                  )
                }
                className={smallBtn}
              >
                Make {u.role === "admin" ? "editor" : "admin"}
              </button>
              <button type="button" disabled={busy} onClick={() => onResetPassword(u)} className={smallBtn}>
                Reset password
              </button>
              <button
                type="button"
                disabled={busy || u.id === meId}
                onClick={() =>
                  void patch(
                    u.id,
                    { disabled: !u.disabled },
                    `${u.username} ${u.disabled ? "re-enabled" : "disabled and signed out"}.`,
                  )
                }
                className={smallBtn}
              >
                {u.disabled ? "Enable" : "Disable"}
              </button>
              <button
                type="button"
                disabled={busy || u.id === meId}
                onClick={() => onDelete(u)}
                className={`${smallBtn} hover:border-(--p-alert) hover:text-(--p-alert)`}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={onCreate} className="border border-(--p-border) bg-(--p-panel) p-6">
        <h2 className="font-display text-xl text-(--p-text)">Add a staff account</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nu-user" className="label-caps mb-1 block text-(--p-text-3)">
              Username
            </label>
            <input id="nu-user" name="username" required minLength={3} maxLength={40} className={field} />
          </div>
          <div>
            <label htmlFor="nu-name" className="label-caps mb-1 block text-(--p-text-3)">
              Display name
            </label>
            <input id="nu-name" name="displayName" maxLength={80} className={field} />
          </div>
          <div>
            <label htmlFor="nu-pass" className="label-caps mb-1 block text-(--p-text-3)">
              Password (min 10 characters)
            </label>
            <input id="nu-pass" name="password" type="password" required minLength={10} className={field} />
          </div>
          <div>
            <label htmlFor="nu-role" className="label-caps mb-1 block text-(--p-text-3)">
              Role
            </label>
            <select id="nu-role" name="role" defaultValue="editor" className={field}>
              <option value="editor">Editor — manages content</option>
              <option value="admin">Administrator — content + accounts</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="label-caps border border-(--p-accent-2) px-5 py-2.5 text-(--p-accent) transition-colors hover:bg-(--p-hover) disabled:opacity-40"
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
