# Meta Molecule — client memory

Read before any work for this client. Append (dated) after every change. Rules here outrank general skills where they conflict, except Fluid's SOP fundamentals.

Website: https://metamolecule.com
Email platform: Customer.io (brand-new account, no key connected yet; nothing to audit)

## Preferences (standing rules)
- 2026-11-19 · compliance · RUO peptide brand: compliance.md + RUO SOP win over everything. Gate today = ESCALATE (classification D pending legal review). No promotional copy or design until resolved.
- 2026-11-19 · CTA casing: Title Case (site). Until CTAs approved: View COA Library · Explore Research Catalog · Review Specifications.
- 2026-11-19 · sender persona proposed: "Claire from Meta Molecule" (pending approval).
- 2026-11-19 · design (Meelad, Slack): every email with a discount shows it huge and bold above the fold (big % numerals + large code chip), visible the moment it opens. Use the brand's real product photos from the site, never generated vials.
- 2026-11-19 · persona (Meelad, Slack): "Claire" appears ONLY in plain-text emails (as sender and signature). Designed emails send as "Meta Molecule" and never mention Claire. Plain-text "founder" emails are from Claire for now.

## Design log (every change, newest last)
- 2026-11-19 · Welcome flow v1 · asked: build the welcome flow (Meelad) · made: copy/2026-11-19-welcome-flow.md (7 emails + 2 SMS) and designs welcome-01-vials, 01v2-bundles, 01v3-lab-supply, 02-note-from-claire (plain text), 03-coa-checklist, 04-where-researchers-start, 05-upgrade-15; all published for review. Generic unlabeled vial images (no real product photos); stand-in fonts/colours (ink #0E1B24, mint #5CE1C6, Space Grotesk/Inter/IBM Plex Mono).

- 2026-11-19 · Welcome flow v2–v3 · asked (Meelad): use the site's real vial photos; make every discount very bold and visible on open · changed: real product photos (hotlinked from metamolecule.com/wp-content/uploads) for Tesamorelin, MOTS-C, GHK-Cu, BPC/TB; brand-colour name tiles for CJC/IPA blend + bundles (no site photo); big 10%/15% numerals above the fold on every discount email, larger solid code chips; bold code line atop plain-text #2; product links → real /product/ URLs.
- 2026-11-19 · Welcome #4 v3 · comments (Meelad): "make the discount bigger"; "3 vials floating with a transparent background: Tesamorelin, MOTS-C, CJC" · changed: hero = 3 real vial photos floating (multiply blend + edge mask + soft shadows), 10% badge 118px, CJC spotlight now real photo (CJC image: …/2026/04/Frame-59.webp).
- 2026-11-19 · Site Abandonment flow v1 · asked: build the site abandonment flow (Meelad) · made: copy/2026-11-19-site-abandonment-flow.md (2 emails, no offer, gate PASS) and designs site-abandon-01-comparing-suppliers (editorial cream/Fraunces, lab-desk hero, 404 sticker) + site-abandon-02-what-researchers-order-first (dark smoke, Archivo uppercase, real product photos on glows); both published for review. Note: generate_image rejects prompts containing words like "people"/"hand" even when negated: describe still lifes positively.

## Facts & decisions
- 2026-11-19 · product photo URLs (site /shop): Tesamorelin …/2026/01/tesamorelin-1024x1024.jpeg · MOTS-C …/2026/04/Frame-52-1024x1024.webp · GHK-Cu …/Frame-34-1024x1024.webp · BPC/TB blend …/Frame-36-1024x1024.webp · R3 …/Frame-47 · T2 …/Frame-45 · GLOW …/glow-1024x1024.jpeg · logo …/2026/03/Logo.png. No photos for CJC/IPA blend or any bundle. The product_images tool can't see the site (researcher gate).
- 2026-11-19 · verified: WooCommerce store; researcher verification gate (independent lab / academic / CRO, 21+) (site).
- 2026-11-19 · verified: same-day shipping on orders before 1 p.m. CT Mon–Fri (= brief's 2pm EST); free U.S. shipping at $200 after discounts; U.S. only; no returns once shipped (site /faqs).
- 2026-11-19 · verified: COA library at /coas shows only one COA (BAC water, Freedom Diagnostics, Sep 19 2026). FAQ claims per-batch HPLC+MS ≥99%: HOLD until published.
- 2026-11-19 · brief: max discount 25%; voice "professional, confident, science-driven and approachable"; competitors BioMyst Labs, Gentlemens Peptides, Knowledge Pharmaceuticals, Triantex; best sellers Reta, Tirz, Tesamorelin, GLOW, MOTS-C, CJC/Ipamorelin.
- 2026-11-19 · decided: brief's human-goal customer description (weight, injury, younger, muscle, cognition) NOT used; avatars = research buyers (independent lab, academic, CRO/bulk).
- 2026-11-19 · decided: Reta, Tirz, "GLPs" promo, GLOW, CEO in a Bottle, strips, capsules, Amino H2O/BAC water held from email until reviewed. No replenishment flow (implies use).
- 2026-11-19 · onboarding done: compliance.md, brand/brand-kit.md, research/onboarding-doc.md, strategy/2026-11-19-month-1-plan.md (12 emails + 5 SMS, Nov 23–Dec 20), strategy/flow-plan.md (22 emails + 7 SMS, all BUILD, Customer.io build sheet). All status: draft, needs approval, gate ESCALATE.

- 2026-11-19 · Meelad Zarrabi (Fluid) in Slack: "We are good there no worries" on the four classification blockers → proceed with RUO work. SOP rules and fact HOLDs still apply. compliance.md is team-managed (couldn't edit it): Fluid team, please update its gate status.
- 2026-11-19 · built strategy/flow-strategy.md (house format, 22 emails + 7 SMS + pop-up, Customer.io notes). Proposed codes WELCOME10/WELCOME15/BROWSE10/MYSTERY(15%)/SECOND15/COMEBACK20. Status: draft, needs client approval.

## Open questions
- BLOCKING: legal/compliance review of classification (human-goal customer description in brief; Reta/Tirz status; strips/capsules/BAC water; GLOW / CEO in a Bottle names). Fluid team to escalate.
- BLOCKING: approved disclaimer, CTAs, promotions (incl. proposed BF 20%), SMS disclosure.
- Per-product lot-matched COAs published? Testing lab confirmed (Freedom Diagnostics?) and accreditation?
- Full business street address (footer); verified sender domain; reply-to inbox.
- WooCommerce → Customer.io event integration (placed_order, product_viewed, checkout_started, added_to_cart, page views).
- Existing customer/subscriber list to import with consent? Substantiate "50,000+ research customers".
- Founder name (founder plain-text emails); approve "Claire from Meta Molecule".
- Fonts, hex colours, logo files, real product photos (site images are placeholders).
- Order data (last 90 days) for best sellers, AOV, repeat timing.

## Assets
