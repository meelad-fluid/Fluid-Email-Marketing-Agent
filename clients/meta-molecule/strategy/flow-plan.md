# Meta Molecule — Flow plan (core system: 22 emails + 7 SMS)

_Prepared 2026-11-19 · Platform: Customer.io (flows = automations) · Version: replenishable, adapted to the RUO SOP · Sources: research/onboarding-doc.md, compliance.md_

Status: draft · needs client approval · **compliance gate: ESCALATE** (no copy until compliance.md §1 is resolved; every email then passes the gate before design)

## Live flows vs the core system
No account audit was possible and the team confirmed the Customer.io account is brand new: **no live flows. Every flow below is BUILD.**

| Flow | Live today | Decision |
|---|---|---|
| Pop-up (4 steps) | None (site signup needs JS, behind researcher gate) | Build |
| Welcome (7 emails + 2 SMS) | None | Build |
| Site abandonment (2 emails) | None | Build |
| Browse abandonment (3 emails + 1 SMS) | None | Build |
| Abandoned cart (4 emails + 2 SMS) | None | Build |
| Post-purchase (4 emails + 1 SMS) | None | Build |
| Winback (2 emails + 1 SMS) | None | Build |
| Replenishment (optional) | — | **Not proposed**: "running low" framing implies use (SOP §9) |

## RUO adaptations (apply to every flow)
- Talk to research buyers (avatars in the onboarding doc): documentation, lots, shipping, support, price. Never bodies, outcomes, use, dosing, "results", "cycle", "running low".
- **No reviews/testimonials about results.** The core system's review emails become documentation emails (how to read a COA, what a lot-matched COA looks like). Service reviews (shipping, support) only if real and about service.
- **Post-purchase "how to use" becomes "your lot's documentation"**: match the COA to the vial, storage per the label/COA (only verified specs), who to contact.
- Product blocks: compound + size + "Review Specifications"/"View COA". Held products (Reta, Tirz, GLOW, CEO in a Bottle, strips, capsules, Amino H2O) never appear in dynamic blocks: exclude them in the Liquid product loop until reviewed.
- Disclaimer in the body of every product email + footer. Full business address in the footer.
- Offers are proposals (HOLD), capped at the brand's 25%. CTAs from the approved list (default: View COA Library, Explore Research Catalog, Review Specifications; "Add to Cart"/"Complete Checkout" only if approved).
- SMS: only to SMS-consented contacts, with the approved SMS disclosure; documentation/shipping/cart reminders. Promo SMS HOLD.

## Proposed offer ladder (all HOLD for approval)
W = 10% welcome · Welcome #5 = 15% for 24 h · Browse #2–#3 = 10% · Cart #3–#4 mystery = "up to 25%" teaser, real 15% · Post-purchase #2/#4 = 15% second order · Winback = 20% (ceiling 25%). Codes never stack with the site's bundle pricing or free-shipping threshold logic beyond what WooCommerce allows; "codes can't be combined".

## Pop-up (4 steps) — BUILD
Shown after the researcher verification gate.
1. **Teaser + question:** "Want 10% off your first research order?" · "What are you ordering for?" → **Single-compound vials** / **Blends & bundles** / **Lab or bulk supply** (maps to the shop's Vials, Blends, Bundles + wholesale; never an effect). Stored as `popup_interest`.
2. **Email:** "Where should we send it?" · "10% off your first order, plus COA library updates when new lots land." · Continue.
3. **SMS (skippable):** "Want shipping and new-lot alerts by text?" · consent line + approved SMS disclosure · "Yes, text me" / "No thanks, email is fine".
4. **Confirmation:** "You're in." · code + where it works (excludes held products) · "Explore Research Catalog".
Creative: real vials on a lab bench with a printed COA.

## 1. Welcome (7 emails + 2 SMS) — BUILD
Trigger: joins segment "Pop-up subscribers" (form submission) · Filter: no `placed_order` since entry · Re-entry: never · Branch on `popup_interest`.

**Email #1 (Vials):** "Welcome to Meta Molecule: here's your 10%" · Immediately · W code · Talking to the independent lab buyer comparing vendor tabs. Mission line ("an industry full of smoke and mirrors"), how documentation works, 3 vials (Tesamorelin 10mg, MOTS-C 40mg, CJC 1295 No DAC / Ipamorelin blend) each with "View COA". Disclaimer.
**Email #1 v2 (Blends & bundles):** same message and code; bundles by compound with list vs bundle price, free shipping at $200.
**Email #1 v3 (Lab or bulk supply):** same message and code; wholesale form, lot consistency, same-day cutoff; "Contact Support".
**SMS #1:** Immediately after #1 · "Welcome to Meta Molecule. Your 10% code: [CODE]. COAs before you order: [link]. [disclosure] Reply STOP to opt out."
**Email #2 (plain text, founder):** +4 h · "A note from [founder]" · why they started (the "smoke and mirrors" line), the decision made on purpose (publish documentation, no price gouging), invite a reply, soft code reminder. Founder name needed.
**Email #3 (replaces reviews):** +1 day · "Four things to check on any COA" · lot match, lab named, method, date; shows a real Meta Molecule COA. Code reminder.
**Email #4 (best sellers):** +1 day · "Where most researchers start" · approved first-order products by compound with specs and COA links (from order data once available).
**Email #5 (upgrade):** +1 day · "Your code just went to 15%, for 24 hours" · first direct ask; same-day shipping cutoff as the second reason.
**SMS #2:** after #5 · "24 hours only: your Meta Molecule code is now 15%: [CODE2]. [link] [disclosure]"

## 2. Site abandonment (2 emails) — BUILD
Trigger: page view event with no product view, add-to-cart or checkout in the session · Filter: not in Browse/Cart flows, no order since entry · Re-entry: 7 days.
**Email #1:** +2 h · "Were you comparing suppliers?" · the inspect-before-you-order standard, COA library, same-day shipping. Welcome code only if still valid.
**Email #2:** +1 day · "What researchers order first" · approved best sellers by compound with "Review Specifications".

## 3. Browse abandonment (3 emails + 1 SMS) — BUILD
Trigger: `product_viewed` event · Filter: no add-to-cart, checkout or order since entry; not in Cart flow · Re-entry: 7 days · Dynamic block = viewed product (held products excluded).
**Email #1:** +2 h · "Still comparing [product]?" · the viewed product with its COA link and specs; why buy from a supplier that shows the lot documentation. No offer.
**Email #2:** +1 day · "Check the COA before you decide" · how to verify the viewed product's lot; 10% browse code; free shipping at $200.
**SMS #1:** after #2 · "Still looking at [product]? Its COA and specs are here: [link] [disclosure]"
**Email #3:** +1 day · "Your 10% code expires tonight" · viewed product, ships today if ordered before 1 p.m. CT.

## 4. Abandoned cart (4 emails + 2 SMS) — BUILD
Trigger: `checkout_started` · Filter: no `placed_order` since entry · Re-entry: 1 day · Dynamic cart table.
**Email #1:** +30 min · "You left this in your cart" · headline → sub → button → cart table → button. No offer.
**SMS #1:** after #1 · "Your Meta Molecule cart is saved. Finish checking out: [link] [disclosure]"
**Email #2 (replaces reviews):** +1 day · "Every item in your cart has a COA" · cart table with a COA link per item; attach item / bundle that gets them to $200 free shipping.
**Email #3:** +1 day · "Your mystery discount is inside" · "Up to 25% off", code MYSTERY reveals 15% at checkout · exclusions stated.
**SMS #2:** after #3 · "Your Meta Molecule mystery code is in your inbox and expires in 48 hours: [link] [disclosure]"
**Email #4:** +1 day · "Last chance: your mystery code expires at midnight" · cart table, one checkout button.

## 5. Post-purchase (4 emails + 1 SMS) — BUILD
Trigger: `placed_order`, first order ever · Re-entry: never.
**Email #1 (plain text, founder):** +5 min · "Thank you, [first name]" · thanks for trusting them; shipping expectations (before 1 p.m. CT ships today; tracking email to follow); no returns once shipped, so check the box on arrival and email support@metamolecule.com if anything is damaged or wrong. Doesn't duplicate the WooCommerce confirmation.
**SMS #1:** after #1 · "Thanks for your Meta Molecule order. Orders before 1 p.m. CT ship same day; tracking follows by email. Questions: reply here. [disclosure]"
**Email #2 (replaces "how to use"):** +1 day · "Match your vial to its COA" · find the lot on the label, open its COA, what each section means; storage per the label/COA (only verified specs). Second-order code (15%) below. Never use, dosing or handling for administration.
**Email #3 (plain text, founder):** +7 days · "Did the COA check out?" · ask for a review of the order/service experience (shipping, documentation, support), invite a reply so problems get caught early. No discount.
**Email #4:** +2 days · "Researchers who ordered [product] also ordered…" · pairing by catalog data (bundles that include it), second-order code with expiry, free shipping at $200.

## 6. Winback (2 emails + 1 SMS) — BUILD
Trigger: `placed_order`, first order ever · Filter: no further orders since entry · Delay: **90 days** (default; set from reorder data once available) · Re-entry: never.
**Email #1:** +90 days · "Since your last order: new lots, published COAs" · what's changed (new lots, COA library, products added), reorder block of what they bought (held products excluded), 20% code, an easy way to tell us if something went wrong. Never "running low", "next cycle", "keep your progress".
**SMS #1:** after #1 · "New lots are in at Meta Molecule and their COAs are published. Your 20% code: [CODE]. [link] [disclosure]"
**Email #2:** +5 days · "Your 20% code expires soon" · same code with expiry, best sellers/bundles, one CTA.

## Count
Emails: Welcome 7 + Site 2 + Browse 3 + Cart 4 + Post-purchase 4 + Winback 2 = **22**. SMS: Welcome 2 + Browse 1 + Cart 2 + Post-purchase 1 + Winback 1 = **7**.

## Customer.io build sheet (for whoever sets up the automations)
| Automation | Trigger | Filters / exit | Delays | Conversion goal |
|---|---|---|---|---|
| Welcome | Form submission → "Pop-up subscribers" segment | Exit on `placed_order`; branch on `popup_interest` | 0 · 4 h · 1 d · 1 d · 1 d | `placed_order` within 5 days |
| Site abandonment | Page-view event | Exit on product_viewed / checkout_started / placed_order; not in Browse/Cart | 2 h · 1 d | same |
| Browse abandonment | `product_viewed` | Exit on added_to_cart / checkout_started / placed_order; not in Cart | 2 h · 1 d · 1 d | same |
| Abandoned cart | `checkout_started` | Exit on `placed_order` | 30 min · 1 d · 1 d · 1 d | same |
| Post-purchase | `placed_order` where order count = 1 | — | 5 min · 1 d · 7 d · 2 d | second `placed_order` |
| Winback | `placed_order` where order count = 1 | Exit on any later `placed_order` | 90 d · 5 d | `placed_order` within 5 days |
Each email's design link, subject and preview get added here as designs are approved; HTML comes from each design's Customer.io build. SMS steps only for contacts with SMS consent.

## Needed before building
WooCommerce → Customer.io integration sending `placed_order` (with order count and line items), `product_viewed`, `added_to_cart`, `checkout_started` (with checkout URL), page views · pop-up tool choice · founder name · approved offers, disclaimer, CTAs and SMS disclosure · per-product COAs live · compliance classification resolved.
