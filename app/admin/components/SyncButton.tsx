"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncKlaviyoAction } from "../klaviyo-actions";

export function SyncButton({ clientId, label }: { clientId: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span className="small muted">{pending ? "Syncing from Klaviyo… this takes about a minute" : label}</span>
      <button
        type="button"
        className="btn btn--ghost btn--small"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await syncKlaviyoAction(clientId);
            if (!r.ok) setError(r.error);
            router.refresh();
          })
        }
      >
        {pending ? "Syncing…" : "Sync now"}
      </button>
      {error && <span className="small" style={{ color: "var(--bad)" }}>{error}</span>}
    </div>
  );
}
