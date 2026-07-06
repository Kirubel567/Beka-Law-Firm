"use client";

import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    if (res.ok) {
      // full navigation so the fresh session cookie is used everywhere
      window.location.assign("/admin");
    } else {
      setError("Invalid credentials.");
      setBusy(false);
    }
  };

  const field =
    "w-full border-b border-parchment-100/20 bg-transparent py-3 text-parchment-100 focus:border-brass-400 focus:outline-none transition-colors";

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-8">
      <div>
        <label htmlFor="lg-user" className="label-caps mb-1 block text-parchment-200/60">
          Username
        </label>
        <input id="lg-user" name="username" type="text" required autoComplete="username" className={field} />
      </div>
      <div>
        <label htmlFor="lg-pass" className="label-caps mb-1 block text-parchment-200/60">
          Password
        </label>
        <input id="lg-pass" name="password" type="password" required autoComplete="current-password" className={field} />
      </div>
      {error && <p className="text-sm text-terracotta-500">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full border border-brass-500/70 px-6 py-3.5 text-[0.72rem] tracking-[0.22em] text-brass-300 uppercase transition-colors hover:bg-brass-400/10 disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Enter the portal"}
      </button>
    </form>
  );
}
