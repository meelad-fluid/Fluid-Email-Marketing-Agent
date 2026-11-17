import { BrandKitSchema, type BrandKit } from "./brand-kit";
import { renderEmailHtml } from "./html";
import { runQa, type QaResult } from "./qa";
import { renderEmail } from "./render";
import { sliceEmail, type Slice } from "./slice";
import { EmailSpecSchema, type EmailSpec, type Section } from "./spec";

// The design pipeline end to end: spec + brand kit → HTML → 2x render → slices → QA.
// Output is what implementation/template-upload sends to Klaviyo after approval.

function defaultLink(s: Section) {
  if ("cta" in s && s.cta) return s.cta.url;
  if (s.type === "product-grid") return s.products[0].cta.url;
  return "";
}

// Alt text carries the slice's actual words so the message survives images-off [SOP].
function defaultAlt(s: Section, kit: BrandKit) {
  switch (s.type) {
    case "hero":
      return [s.announcement, s.headline, s.subheadline, s.offer?.code && `Use code ${s.offer.code}`, s.offer?.deadline, s.cta.label].filter(Boolean).join(". ");
    case "icon-row":
      return [s.title, ...s.items.map((i) => i.label)].filter(Boolean).join(". ");
    case "text-block":
      return [s.title, ...s.paragraphs].filter(Boolean).join(" ");
    case "product-grid":
      return [s.title, ...s.products.map((p) => `${p.name}: ${p.blurb}`)].filter(Boolean).join(". ");
    case "reviews":
      return [s.title, ...s.reviews.map((r) => `"${r.quote}" ${r.name}`)].filter(Boolean).join(" ");
    case "comparison":
      return `${s.title}. ${s.us} vs ${s.them}: ${s.rows.map((r) => r.label).join(", ")}`;
    case "steps":
      return `${s.title}. ${s.steps.map((st, i) => `${i + 1}. ${st.title}`).join(" ")}`;
    case "offer-recap":
      return [s.headline, s.code && `Use code ${s.code}`, s.deadline, s.cta.label].filter(Boolean).join(". ");
    case "footer":
      return kit.name;
  }
}

export function klaviyoTemplateHtml(slices: Pick<Slice, "file" | "link" | "alt" | "height">[], kit: BrandKit, srcFor = (s: { file: string }) => s.file) {
  // Zero-padding stacked image blocks [SOP], one link per slice, live-text legal footer.
  const rows = slices
    .map((s) => {
      const img = `<img src="${srcFor(s)}" width="600" alt="${s.alt.replace(/"/g, "&quot;")}" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none">`;
      return `<tr><td style="padding:0;line-height:0;font-size:0">${s.link ? `<a href="${s.link}" target="_blank">${img}</a>` : img}</td></tr>`;
    })
    .join("\n");
  const f = kit.footer;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${kit.colors.background}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${kit.colors.background}"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
${rows}
<tr><td style="padding:18px 24px 28px;text-align:center;font:12px/1.6 Helvetica,Arial,sans-serif;color:${kit.colors.textMuted}">${f.compliance ? `${f.compliance}<br>` : ""}${f.address}<br><a href="{% unsubscribe_url %}" style="color:inherit">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;
}

export type BuildResult = { html: string; png: Buffer; slices: Slice[]; qa: QaResult[]; passed: boolean; templateHtml: string };

export async function buildEmail(specInput: unknown, kitInput: unknown): Promise<BuildResult> {
  const spec: EmailSpec = EmailSpecSchema.parse(specInput);
  const kit = BrandKitSchema.parse(kitInput);
  const html = await renderEmailHtml(spec, kit);
  const { png, sections } = await renderEmail(html);
  const meta = Object.fromEntries(spec.sections.map((s) => [s.id, { link: s.link ?? defaultLink(s), alt: s.alt ?? defaultAlt(s, kit) }]));
  const slices = await sliceEmail(png, sections, meta);
  const qa = runQa(spec, sections, slices);
  const passed = qa.every((r) => r.pass || r.severity === "warn");
  return { html, png, slices, qa, passed, templateHtml: klaviyoTemplateHtml(slices, kit) };
}
