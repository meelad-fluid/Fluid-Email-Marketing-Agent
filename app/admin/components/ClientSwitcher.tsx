"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Top-left corner: which client you're working on. Switching keeps you on the same section.
export function ClientSwitcher({ current, clients }: { current: { id: string; name: string }; clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const router = useRouter();
  const section = path.split(`/admin/c/${current.id}`)[1] ?? "";

  useEffect(() => {
    document.cookie = `fluid_last_client=${current.id}; path=/admin; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  }, [current.id]);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const list = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="switcher" ref={ref}>
      <button type="button" className="switcher-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="switcher-avatar" aria-hidden>{current.name.slice(0, 1).toUpperCase()}</span>
        <span className="switcher-name">{current.name}</span>
        <span aria-hidden className="muted">▾</span>
      </button>
      {open && (
        <div className="switcher-menu">
          {clients.length > 6 && <input className="input" autoFocus placeholder="Find a client" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 6 }} />}
          <ul role="listbox" aria-label="Clients">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.id === current.id}
                  className={c.id === current.id ? "active" : ""}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/admin/c/${c.id}${section}`);
                  }}
                >
                  <span className="switcher-avatar small" aria-hidden>{c.name.slice(0, 1).toUpperCase()}</span>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="switcher-foot">
            <Link href="/admin/clients" onClick={() => setOpen(false)}>All clients</Link>
            <Link href="/admin/clients#new" onClick={() => setOpen(false)}>+ New client</Link>
          </div>
        </div>
      )}
    </div>
  );
}
