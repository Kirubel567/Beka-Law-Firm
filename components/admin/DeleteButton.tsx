"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({
  collection,
  id,
}: {
  collection: string;
  id: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="label-caps text-parchment-200/40 transition-colors hover:text-terracotta-500"
      >
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await fetch(`/api/admin/collections/${collection}/${id}`, { method: "DELETE" });
          router.refresh();
        }}
        className="label-caps text-terracotta-500"
      >
        {busy ? "Removing…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="label-caps text-parchment-200/60"
      >
        Keep
      </button>
    </span>
  );
}
