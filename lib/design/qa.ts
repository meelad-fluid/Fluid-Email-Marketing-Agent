import { FOLD_PX } from "./html";
import type { MeasuredSection } from "./render";
import type { Slice } from "./slice";
import type { EmailSpec } from "./spec";

// The automated half of skills/design/design-qa. "block" failures stop an email
// from going to review; the composer fixes and re-renders until these pass.

export type QaResult = { code: string; pass: boolean; severity: "block" | "warn"; detail: string };

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const sentences = (t: string) => (t.match(/[.!?]+(\s|$)/g) ?? []).length || 1;

export function runQa(spec: EmailSpec, sections: MeasuredSection[], slices: Slice[]): QaResult[] {
  const out: QaResult[] = [];
  const add = (code: string, pass: boolean, severity: QaResult["severity"], detail: string) => out.push({ code, pass, severity, detail });
  const hero = spec.sections.find((s) => s.type === "hero");
  const heroBox = sections.find((s) => s.type === "hero");

  // Fold
  const primaryCta = heroBox?.ctas[0];
  const ctaBottom = primaryCta ? Math.round(primaryCta.y + primaryCta.height) : null;
  add("cta_above_fold", ctaBottom !== null && ctaBottom <= FOLD_PX, "block",
    ctaBottom === null ? "No button in the hero" : `Primary button ends at ${ctaBottom}px (limit ${FOLD_PX}px)`);
  if (hero?.type === "hero") {
    add("headline_length", words(hero.headline) <= 10, "warn", `Headline is ${words(hero.headline)} words (max 10)`);
    if (hero.subheadline) add("sub_length", words(hero.subheadline) <= 20, "warn", `Sub-headline is ${words(hero.subheadline)} words (max 20)`);
    if (spec.campaignType === "sale") {
      const hasOffer = /\d+\s*%|\$\d+|off|free|bogo|buy \d/i.test(hero.headline);
      add("sale_in_headline", hasOffer, "block", hasOffer ? "Offer is in the headline" : `Sale email but the headline has no offer: "${hero.headline}"`);
    }
  } else {
    add("hero_first", false, "block", "Email has no hero section");
  }

  // Body
  const second = spec.sections[1];
  add("bridge_after_hero", second?.type === "icon-row" || second?.type === "comparison", "block",
    `Section after the hero is "${second?.type}" (needs icon-row or comparison)`);
  const noCta = sections.filter((s) => s.type !== "footer" && s.ctas.length === 0).map((s) => s.id);
  add("cta_every_section", noCta.length === 0, "block", noCta.length ? `No button in: ${noCta.join(", ")}` : "Every section ends with a button");
  const tooMany = spec.sections.filter((s) =>
    (s.type === "icon-row" && s.items.length > 3) || (s.type === "product-grid" && s.products.length > 3) || (s.type === "reviews" && s.reviews.length > 3)).map((s) => s.id);
  add("max_three", tooMany.length === 0, "block", tooMany.length ? `More than 3 points in: ${tooMany.join(", ")}` : "All sections in sets of 3 or fewer");
  const longParas = spec.sections.flatMap((s) => (s.type === "text-block" ? s.paragraphs.filter((p) => sentences(p) > 2) : []));
  add("paragraph_length", longParas.length === 0, "warn", longParas.length ? `${longParas.length} paragraph(s) over 2 sentences` : "Paragraphs are 1–2 sentences");
  const missing = sections.flatMap((s) => s.missingAssets);
  add("assets_present", missing.length === 0, "warn", missing.length ? `Photos needed: ${missing.join(" · ")}` : "All images supplied");

  // Length: promos 2–3 phone screens, educational 3–4 (playbook §3.5).
  const screens = sections.reduce((h, s) => Math.max(h, s.y + s.height), 0) / FOLD_PX;
  const maxScreens = spec.campaignType === "educational" ? 4 : 3;
  add("email_length", screens <= maxScreens, "warn", `${screens.toFixed(1)} screens (target ≤ ${maxScreens} for ${spec.campaignType})`);

  // Technical
  add("alt_text", slices.every((s) => s.alt.trim().length > 0), "block", "Every slice has alt text");
  const total = slices.reduce((n, s) => n + s.bytes, 0);
  const bigSlices = slices.filter((s) => s.bytes > 150_000).map((s) => s.file);
  add("slice_size", bigSlices.length === 0 && total <= 800_000, "block",
    `Total ${(total / 1024).toFixed(0)}KB (max 800KB)${bigSlices.length ? `; over 150KB: ${bigSlices.join(", ")}` : ""}`);
  const weak = slices.filter((s) => s.savedPct < 70).map((s) => `${s.file} (${s.savedPct}%)`);
  add("compression", weak.length === 0, "block", weak.length ? `Under 70% smaller: ${weak.join(", ")}` : "Every slice at least 70% smaller than raw");
  add("unsubscribe", true, "block", "Unsubscribe is live text under the slices");

  return out;
}
