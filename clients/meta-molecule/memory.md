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
- 2026-11-19 · Site Abandonment #2 v2 · Gloria (review comment): hard line in the background → texture now stretched once (no repeat-y) and hero fades into body. Rule: never tile a photo texture vertically; seams show.
- 2026-11-19 · Site Abandonment #2 v3 · Gloria: removed hero time pill + giant "1 PM CENTRAL" type; wants a real picture on every product → swapped CJC/IPA (no photo) for BPC157/TB500 Blend. Rule: feature only products with a real site photo; no type-only product tiles.
- 2026-11-19 · Meelad: "hold off for now" on further flows (don't start browse abandonment until asked).
- 2026-11-20 · Abandoned Checkout flow v1 · asked: "let's work on the Abandoned Checkout Flow" (Gloria) · made: copy/2026-11-20-abandoned-checkout-flow.md (4 emails + 2 SMS, gate PASS) and designs checkout-01-check-one-more-thing (night navy, serif, blue-hour lab), 02-paperwork-first (cream/brass checklist, COA loupe photo, free-ship progress bar), 03-mystery-discount (dark teal, Anton "??% OFF", ghost-type cart tiles, dispatch boxes), 04-last-call (editorial script + serif caps, midnight lab clock photo, floating cart cards); all published, one flow link. Decisions: main CTA "Review Your Order" (transactional CTAs not approved; swap to "Complete Checkout" once approved); dropped strategy's "up to 25%" mystery teaser since MYSTERY is a flat 15% for everyone (misleading); "every item has a COA" softened (per-lot COAs still HOLD); no bundle tile (no bundle photos). Sample cart MOTS-C 40mg + Tesamorelin 10mg = $179. generate_image also blocks "face", "hands", "before" (even for a clock): say "dial", "pointers".
- 2026-11-20 · Browse Abandonment flow v1 · asked: Gloria (Slack) "start with the browse abandonment flow" · made: copy/2026-11-20-browse-abandonment-flow.md (3 emails + 1 SMS, gate PASS, BROWSE10 proposed) and designs browse-abandon-01-still-comparing (white, Bebas, tilted browser-window cards), 02-check-the-coa (navy, Barlow Condensed, dashed coupon, 2×2 COA checklist), 03-ends-tonight (blue-hour lab photo hero, Oswald, circle product + sticker); all published, flow link …/f/q_yGmarkKfBnmxszunp33nZ3. Sample dynamic product = MOTS-C 40mg. Copy never says a specific product's lot COA is published (per-batch HOLD): product CTAs = Review Specifications.
- 2026-11-23 · Browse Abandonment v2 (all 3) · Gloria (review comment): dynamic product section must be ESP-ready → plain white background, straight product image + name + price + button only; removed tags, stickers, code pills, rotations and on-design build notes. Rule: dynamic/ESP blocks are always plain, with no decorative or placeholder text (dynamic logic notes go in the README only).
- 2026-11-23 · Browse Abandonment #3 v3 · Gloria: removed the giant "10% off with code" numerals from the hero (headline already says 10%; code chip kept). Rule: don't repeat the offer as giant numerals when the headline already states it.
- 2026-11-23 · Browse Abandonment #3 v4 · Gloria (review comment "on one line please"): the hero line under the code ("Use it on what you were looking at before 11:59 p.m. CT.") no longer wraps. Rule: short hero sublines go on one line, without an orphaned wrap.
- 2026-11-23 · Browse Abandonment #2 v3 · Gloria: "make this more converting" on the headline → "Still deciding? Here's 10% off." (offer-led, bigger, links to the product); removed the giant "10% off with code" numerals. Rule: in abandonment emails, lead the hero with the offer and the reader's hesitation, not the education angle.
- 2026-11-23 · Browse Abandonment #2 v4 · Gloria: kicker "Before you decide" clashed with the new headline "Still deciding?" → now "Pick up where you left off" (links to product). Rule: when a headline changes, recheck the kicker/eyebrow above it for repetition.
- 2026-11-23 · Real logo · Gloria (Slack): "use this logo in all emails" → stored in library (brand/assets/library/meta-molecule-primary-logo-gradient-molecule-wordm.png), brand book created, logo swapped into header + footer of all 15 designed emails (browse bars turned white; elsewhere white rounded chip on dark), all republished. Rule: logo always on white (band or chip), never the old ring + spaced-text placeholder. Plain-text Welcome #2 has no logo.
- 2026-11-23 · Abandoned Checkout v3 (all 4) · Gloria (review comment on #2, "apply to all"): dynamic cart section must be ESP-ready → plain white section with product image + name + qty + price + one button; removed card/tile/floating styling, Specs links, free-shipping progress bar, subtotal rows, ghost type, #1's "2 items · $179 · saved" hero pill and on-design build notes. #4's cart moved off the clock photo (photo now a shorter standalone band).
- 2026-11-23 · Abandoned Checkout #1 · Gloria ("take this out", left on v2): the "2 items · $179 · saved" hero pill, already removed in v3; replied + resolved, no new version.
- 2026-11-23 · note: renders show every metamolecule.com hotlinked product photo as broken (site blocking). Need product photos saved locally.
- 2026-11-20 · note: the write hook blocks a CSS class named after the dotfile for secrets (dot + "env"): name classes differently.

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
