import type { BrandKit } from "./brand-kit";
import type { EmailSpec, Section } from "./spec";
import { SectionView } from "./sections";

// Spec + brand kit → one self-contained HTML page, 600px wide.
// This page is only ever screenshotted (emails ship as image slices), so modern CSS is fine here.

export const EMAIL_WIDTH = 600;
export const FOLD_PX = 750;

function bgColor(kit: BrandKit, token: Section["bg"]) {
  return kit.colors[token];
}

function fontsLink(kit: BrandKit) {
  // Ask only for weights each font is used at; Google rejects weights a family doesn't have.
  const { display, body } = kit.fonts;
  const fams = [
    display.googleFont && { family: display.family, weights: [display.weight] },
    body.googleFont && { family: body.family, weights: display.family === body.family ? [400, 700, 800, display.weight] : [400, 700, 800] },
  ].filter((f): f is { family: string; weights: number[] } => !!f);
  if (!fams.length) return "";
  const q = fams
    .map((f) => `family=${encodeURIComponent(f.family)}:wght@${[...new Set(f.weights)].sort((a, b) => a - b).join(";")}`)
    .join("&");
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=block">`;
}

function css(kit: BrandKit) {
  const c = kit.colors;
  const radius = { pill: "999px", rounded: "12px", square: "2px" }[kit.button.shape];
  return `
:root{--primary:${c.primary};--secondary:${c.secondary};--bg:${c.background};--surface:${c.surface};--text:${c.text};--muted:${c.textMuted};--accent:${c.accent};--on-accent:${c.onAccent};--on-primary:${c.onPrimary};
--display:'${kit.fonts.display.family}',Georgia,serif;--body:'${kit.fonts.body.family}',Helvetica,Arial,sans-serif;--radius:${radius};}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${EMAIL_WIDTH}px;background:var(--bg);font-family:var(--body);color:var(--text);-webkit-font-smoothing:antialiased}
.email{width:${EMAIL_WIDTH}px;overflow:hidden}
.section{position:relative;padding-bottom:56px}
.section:last-of-type{padding-bottom:0}
.bg-background{background:var(--bg)} .bg-surface{background:var(--surface)}
.bg-primary{background:var(--primary);color:var(--on-primary)} .bg-secondary{background:var(--secondary)}
.bg-primary .body,.bg-primary .sub,.bg-primary .icon-detail{color:var(--on-primary);opacity:.88}
.edge-svg{position:absolute;left:0;bottom:-1px;width:100%;height:44px;display:block}
.edge-fade{position:absolute;left:0;bottom:0;width:100%;height:56px}
.pad{padding:36px 44px 0;text-align:center;position:relative;z-index:1}
.logo{padding:26px 0 18px;text-align:center}
.logo img{height:44px}
.wordmark{font-family:var(--display);font-weight:${kit.fonts.display.weight};font-size:28px;letter-spacing:.06em;text-transform:uppercase}
.announcement{background:var(--text);color:var(--bg);font-weight:700;font-size:14px;letter-spacing:.08em;text-transform:uppercase;text-align:center;padding:10px 16px}
.hero-copy{padding-top:28px}
.headline{font-family:var(--display);font-weight:${kit.fonts.display.weight};font-size:50px;line-height:1.04;letter-spacing:-.015em;text-transform:${kit.fonts.display.transform}}
.hl{color:var(--accent)}
.headline,.sub,.section-title,.recap-headline,.body,.review-quote{text-wrap:balance}
.sub{font-size:19px;line-height:1.45;margin:16px auto 0;max-width:470px;color:var(--muted)}
.chip-wrap{margin-top:20px}
.code-chip{display:inline-block;border:2px dashed currentColor;padding:9px 18px;font-size:15px;letter-spacing:.1em;border-radius:8px}
.code-chip strong{font-weight:800;margin-left:4px}
.deadline{display:inline-block;margin-top:12px;background:var(--text);color:var(--bg);font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border-radius:999px}
.bg-primary .deadline{background:var(--on-primary);color:var(--primary)}
.cta-wrap{margin-top:26px}
.btn{display:inline-block;min-width:62%;background:var(--accent);color:var(--on-accent);font-family:var(--body);font-weight:800;font-size:18px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:19px 34px;border-radius:var(--radius);border:2px solid ${kit.button.borderColor};box-shadow:0 5px 0 ${kit.button.shadowColor},0 10px 22px rgba(0,0,0,.18)}
.hero-img{margin-top:30px}
.img{display:block;width:100%;object-fit:cover}
.hero-img.img{height:380px}
.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;height:220px;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--secondary) 70%,transparent) 0 14px,color-mix(in srgb,var(--secondary) 45%,transparent) 14px 28px);color:var(--text);border:2px dashed color-mix(in srgb,var(--text) 35%,transparent)}
.placeholder span{font-weight:800;letter-spacing:.12em;font-size:13px}
.placeholder small{font-size:13px;max-width:70%;text-align:center;opacity:.8}
.section-title{font-family:var(--display);font-weight:${kit.fonts.display.weight};font-size:34px;line-height:1.1;margin-bottom:22px;text-transform:${kit.fonts.display.transform}}
.body{font-size:18px;line-height:1.55;color:var(--muted);margin:0 auto 12px;max-width:480px}
.body.lead{color:inherit;font-weight:700}
.icon-row{display:flex;gap:14px;justify-content:center}
.icon-item{flex:1;max-width:160px}
.icon-badge{width:76px;height:76px;margin:0 auto 12px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--primary);border:2px solid var(--primary)}
.bg-primary .icon-badge{background:var(--on-primary);border-color:var(--on-primary)}
.icon-label{font-weight:800;font-size:16px;line-height:1.25}
.icon-detail{font-size:14px;line-height:1.4;color:var(--muted);margin-top:4px}
.products{display:flex;gap:14px;justify-content:center}
.product-card{flex:1;background:var(--bg);border-radius:18px;padding:0 0 22px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.08)}
.product-img.img{height:200px}
.products.n1 .product-img.img{height:300px}
.product-name{font-family:var(--display);font-weight:${kit.fonts.display.weight};font-size:21px;margin:16px 12px 4px}
.product-blurb{font-size:14px;line-height:1.4;color:var(--muted);margin:0 14px}
.product-price{font-weight:800;margin-top:8px}
.product-card .btn{min-width:0;font-size:13px;padding:13px 16px}
.product-card .cta-wrap{margin-top:14px}
.review{position:relative;background:var(--bg);border-radius:18px;padding:26px 30px 22px;margin:0 auto 14px;text-align:left;box-shadow:0 6px 18px rgba(0,0,0,.07)}
.bg-primary .review{color:var(--text)}
.quote-mark{position:absolute;right:22px;top:-6px;font-family:var(--display);font-size:96px;line-height:1;color:var(--primary);opacity:.18}
.stars{color:#F5A623;font-size:20px;letter-spacing:2px}
.review-quote{font-size:17px;line-height:1.5;font-style:italic;margin:8px 0 10px}
.review-name{font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.06em}
.compare{width:100%;border-collapse:separate;border-spacing:0;background:var(--bg);border-radius:16px;overflow:hidden;font-size:16px;box-shadow:0 6px 18px rgba(0,0,0,.07);color:var(--text)}
.compare th{padding:16px 10px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.compare th.us{background:var(--primary);color:var(--on-primary)}
.compare td{padding:14px 12px;border-top:1px solid color-mix(in srgb,var(--text) 10%,transparent);font-weight:600}
.compare td:first-child{text-align:left}
.compare td.us{background:color-mix(in srgb,var(--primary) 10%,transparent);color:var(--primary);font-size:22px;font-weight:900}
.compare td.them{color:var(--muted);font-size:20px}
.steps{text-align:left;max-width:460px;margin:0 auto}
.step{display:flex;gap:18px;align-items:flex-start;margin-bottom:20px}
.step-num{flex:none;width:46px;height:46px;border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:900;font-size:22px;display:flex;align-items:center;justify-content:center}
.step-title{font-weight:800;font-size:18px}
.step-detail{font-size:16px;line-height:1.45;color:var(--muted)}
.recap-headline{font-family:var(--display);font-weight:${kit.fonts.display.weight};font-size:44px;line-height:1.05;text-transform:${kit.fonts.display.transform}}
.footer{padding:40px 44px 36px}
.footer-mark{font-size:24px}
.badges{display:flex;gap:10px;justify-content:center;margin-top:18px}
.badge{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:1.5px solid currentColor;border-radius:999px;padding:6px 12px;opacity:.85}
.socials{display:flex;gap:10px;justify-content:center;margin-top:18px}
.social{width:34px;height:34px;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
.legal{width:${EMAIL_WIDTH}px;padding:18px 44px 28px;text-align:center;font-size:12px;line-height:1.6;color:var(--muted);background:var(--bg)}
.legal a{color:inherit}
`;
}

// The unsubscribe/legal line stays live text in Klaviyo [SOP compliance], so it's
// rendered here for preview but excluded from slicing.
export function legalHtml(kit: BrandKit, unsubscribeHref = "{% unsubscribe_url %}") {
  const f = kit.footer;
  return `<div class="legal" data-live="legal">${f.compliance ? `${f.compliance}<br>` : ""}${f.address}<br><a href="${unsubscribeHref}">Unsubscribe</a></div>`;
}

export async function renderEmailHtml(spec: EmailSpec, kit: BrandKit) {
  // Dynamic import: Next.js doesn't allow a static react-dom/server import in route handlers.
  const { renderToStaticMarkup } = await import("react-dom/server");
  const body = renderToStaticMarkup(
    <main className="email">
      {spec.sections.map((s, i) => {
        const next = spec.sections[i + 1];
        return <SectionView key={s.id} s={s} kit={kit} nextColor={next ? bgColor(kit, next.bg) : null} />;
      })}
    </main>,
  );
  return `<!doctype html><html><head><meta charset="utf-8"><title>${spec.subject}</title>${fontsLink(kit)}<style>${css(kit)}</style></head><body>${body}${legalHtml(kit, "#")}</body></html>`;
}
