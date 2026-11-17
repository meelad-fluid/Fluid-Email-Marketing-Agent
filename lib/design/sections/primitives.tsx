import type { ReactNode } from "react";

// Small building blocks shared by every section.

export function Button({ label, url, primary }: { label: string; url: string; primary?: boolean }) {
  return (
    <div className="cta-wrap">
      <a className="btn" href={url} data-cta={primary ? "primary" : "section"}>
        {label}
      </a>
    </div>
  );
}

// Dashed = "copy this". Solid button = "tap this" (playbook §1, Offer).
export function CodeChip({ code }: { code: string }) {
  return (
    <div className="chip-wrap">
      <span className="code-chip">
        USE CODE <strong>{code}</strong>
      </span>
    </div>
  );
}

export function Img({ src, description, className }: { src: string | null; description: string; className?: string }) {
  if (src) return <img className={`img ${className ?? ""}`} src={src} alt={description} />;
  // Missing asset: visible placeholder so nobody mistakes it for a finished email. QA flags it.
  return (
    <div className={`img placeholder ${className ?? ""}`} data-missing-asset={description}>
      <span>PHOTO NEEDED</span>
      <small>{description}</small>
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return <div className="stars">{"★".repeat(n)}{"☆".repeat(5 - n)}</div>;
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

// Headline with one word or number pulled out in the accent color.
export function Headline({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) return <h1 className="headline">{text}</h1>;
  const [before, ...rest] = text.split(highlight);
  return (
    <h1 className="headline">
      {before}
      <span className="hl">{highlight}</span>
      {rest.join(highlight)}
    </h1>
  );
}

// Section-to-section transition, drawn in the next section's color [SOP: continuous flow].
export function Edge({ kind, color }: { kind: string; color: string }) {
  if (kind === "straight") return null;
  if (kind === "fade") return <div className="edge-fade" style={{ background: `linear-gradient(to bottom, transparent, ${color})` }} />;
  const d =
    kind === "curve"
      ? "M0,40 Q300,-20 600,40 L600,60 L0,60 Z"
      : "M0,30 C100,0 200,60 300,30 C400,0 500,60 600,30 L600,60 L0,60 Z";
  return (
    <svg className="edge-svg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill={color} />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  leaf: <path d="M6 21c0-9 6-15 15-15 0 9-6 15-15 15Zm0 0 8-8" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Zm-3 9 2 2 4-4" />,
  check: <path d="M5 12l4 4 10-10" />,
  truck: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1" />,
  sparkle: <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  drop: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" />,
  clock: <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  brain: <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
};

export function Icon({ name }: { name: string }) {
  return (
    <div className="icon-badge">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name] ?? ICONS.check}
      </svg>
    </div>
  );
}
