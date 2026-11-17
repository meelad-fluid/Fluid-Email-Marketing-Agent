"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN = [
  { href: "", label: "Home", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/calendar", label: "Campaign calendar & pipeline", icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" },
  { href: "/builder", label: "Campaign builder", icon: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4" },
];
const SECONDARY = [{ href: "/profile", label: "Client profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" }];

function Item({ base, href, label, icon }: { base: string; href: string; label: string; icon: string }) {
  const path = usePathname();
  const full = base + href;
  const active = href === "" ? path === base : path.startsWith(full);
  return (
    <Link href={full} className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={icon} />
      </svg>
      <span>{label}</span>
    </Link>
  );
}

export function SideNav({ clientId }: { clientId: string }) {
  const base = `/admin/c/${clientId}`;
  return (
    <nav className="nav" aria-label="Workspace">
      <div className="nav-group">
        {MAIN.map((i) => <Item key={i.label} base={base} {...i} />)}
      </div>
      <div className="nav-group nav-group--bottom">
        {SECONDARY.map((i) => <Item key={i.label} base={base} {...i} />)}
      </div>
    </nav>
  );
}
