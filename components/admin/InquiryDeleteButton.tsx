"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InquiryDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="label-caps text-(--p-text-4) transition-colors hover:text-(--p-alert)"
      >
        Remove
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
          await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
          router.refresh();
        }}
        className="label-caps text-(--p-alert)"
      >
        {busy ? "Removing…" : "Confirm removal"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="label-caps text-(--p-text-3)"
      >
        Keep
      </button>
    </span>
  );
}
