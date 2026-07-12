import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, listAudit } from "@/lib/users";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "login": "signed in",
  "login.failed": "failed sign-in",
  "login.locked": "sign-in locked out",
  "item.create": "created",
  "item.update": "updated",
  "item.delete": "deleted",
  "site.update": "updated site settings",
  "inquiry.delete": "deleted an inquiry",
  "upload": "uploaded",
  "user.create": "created account",
  "user.update": "changed account",
  "user.delete": "deleted account",
};

export default async function AuditPage() {
  const me = await currentUser();
  if (!me || me.role !== "admin") redirect("/admin");

  const entries = listAudit(200);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="label-caps text-(--p-text-3) hover:text-(--p-accent)">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-(--p-text)">Activity log</h1>
      <p className="mt-2 max-w-2xl text-sm text-(--p-text-3)">
        The most recent 200 actions in the portal — sign-ins, content changes,
        and account administration. Every entry names the account that acted.
      </p>

      <div className="mt-8 border border-(--p-border) bg-(--p-panel)">
        {entries.length === 0 && (
          <p className="p-8 text-sm text-(--p-text-3)">Nothing recorded yet.</p>
        )}
        <ul className="divide-y divide-(--p-border)">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
              <span className="text-xs whitespace-nowrap text-(--p-text-4) tabular-nums">
                {new Date(e.at).toLocaleString("en-GB")}
              </span>
              <span className="text-sm text-(--p-text)">{e.actor}</span>
              <span
                className={`text-sm ${e.action.startsWith("login.") ? "text-(--p-alert)" : "text-(--p-text-2)"}`}
              >
                {ACTION_LABELS[e.action] ?? e.action}
              </span>
              {e.collection && (
                <span className="label-caps text-[0.6rem] text-(--p-accent-2)">{e.collection}</span>
              )}
              {(e.detail || e.itemId) && (
                <span className="min-w-0 truncate text-xs text-(--p-text-3)">
                  {e.detail ?? e.itemId}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
