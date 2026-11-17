# Arq8 — client memory

Read before any work for Arq8. Append (dated) after every change. Rules here outrank general skills where they conflict, except Fluid's SOP fundamentals.

## Preferences (standing rules)
- 2026-11-16 · design · Product images must sit on transparent backgrounds — no white boxes behind jars or gummies on any background. Arq8's Shopify PNGs often *look* transparent but are opaque white; always cut them out (see Assets). (Meelad, BF20 email v1 feedback)
- 2026-11-16 · design · More pop of color: floating gummies and strawberry-red / mango-yellow splashes. The silver-and-black base alone reads too flat; keep it premium but always add color. (Meelad, BF20 email v1 feedback)
- 2026-11-16 · design · Floating gummies use the two creatine flavors (strawberry, mango) only — not the yellow Magnesium+ gummies — so the decoration matches what's on sale.
- 2026-11-16 · copy · Voice: calm authority, scientific not academic, no hype / wellness clichés / fitness-bro energy, mechanism before promise (onboarding form).
- 2026-11-16 · strategy · Lead with Creatine Gummies; other products are upsells or free gifts. Max discount 20%. Retention angle: creatine needs ~28 days daily to accumulate — remind consistency, show clinical proof (onboarding form).

## Design log (every change, newest last)
- 2026-11-16 · BF20 sitewide (Nov 25) v1 · first design-only test from supplied copy · silver/black Arq8 look, GT Canon headlines, jar-count price cards, icon terms, Informed Sport + CLP + 96% ring proof, flavor cards, USP strip · designs/2026-11-25-bf20-sitewide/
- 2026-11-16 · BF20 sitewide v2 · asked: strawberry jar in hero had a white background; wanted more color (floating gummies, red/yellow splashes) · changed: strawberry jar re-cut transparent (also fixes the 3-pack dark card); mango jar now in front in hero; red + mango splash blobs behind jars; 5 floating gummies in hero, 1 on 3-pack card, 2 per flavor card; BF20 in headline in strawberry red; new strawberry→mango gradient band "20% OFF EVERYTHING · CODE BF20"; 96% ring in red→yellow gradient; flavor cards now full strawberry-red and mango-yellow; accent rules on terms; red top border on footer · designs/2026-11-25-bf20-sitewide/

## Facts & decisions
- 2026-11-16 · verified: gummy prices on arq-8.com are $59 / $99 / $145 one-time (1/2/3 packs); subscribe $45 / $83 / $118. BF20 (20%) gives exactly the copy's numbers ($47.20/$79.20/$116 one-time; $36/$66.40/$94.40 subscribed).
- 2026-11-16 · conflict (unresolved): onboarding form says "1000 mesh" nano-creatine; a site listing image says "500 mesh particles". Ask client before any copy about particle size.
- 2026-11-16 · the "Brand Guidelines" PDF is the onboarding form — no visual guidelines. Visual identity taken from arq-8.com (see brand/brand-kit.md). Client said design inspiration Figma is available from their manager — not received.

## Open questions
- Which mesh figure is right (1000 vs 500)?
- Access to the Brand Assets Drive folder and reviews Drive folder (linked in onboarding form) for higher-res photography and real reviews.
- Footer: unsubscribe/preferences links and business address.

## Assets
- brand/assets/hero-jars2.webp — strawberry + mango jars composite (mango in front), transparent.
- brand/assets/jar-strawberry-cut.webp — strawberry jar cut from Shopify `bundle-main…png` (opaque white bg) with flood-fill white removal (`_cutout-tool.js`).
- brand/assets/jar-mango.webp — from Shopify `50.png` (real alpha).
- brand/assets/gummies-mango-f.webp — mango gummy pair, hue-keyed from `50.png`; gummies-straw-f.webp = same pair hue-shifted −30° to strawberry red (real strawberry gummies can't be separated from the pink jar behind them).
- brand/assets/badge-informed-w.png, badge-clp-w.png, usp-strip-w.png — certification badges cropped from Arq8 listing images, backgrounds whitened.
- brand/assets/powder.png, magnesium.webp, electrolytes-c.png — other products, transparent.
- brand/assets/logo-black.svg — from arq-8.com header (invert for dark backgrounds).
