# Formera Research — Flow plan (core system: 22 emails + 7 SMS)
_Prepared 2026-11-20 · Platform: Customer.io (proposed) · Version: replenishable structure, rewritten for research-use-only rules · From: Erin from Formera Research (proposed); plain-text notes from the owner (name TBC)_

> **Compliance:** status ESCALATE (compliance.md §1). This plan is the structure; copy is written only after classification A, and every email/SMS passes the RUO gate before design. RUO changes to the standard system: no "how to use" email (replaced by documentation access), no "running low"/replenishment flow, reviews only about service/shipping/price, no do-not-feature products anywhere (GLP-3 R, Tesamorelin, PT-141, HCG, HMG, Gonadorelin, B12, Melanotan, Bac water), CTAs from compliance.md §3, approved disclaimer in the body of every product email. All discounts are proposals, HOLD until promotions are approved (max 25%, brief).

## Live flows vs core system
No email platform today (brief), so there are no live flows to keep or fix.

| Flow | Live today | Decision |
|---|---|---|
| Pop-up (4 steps) | none | **Build** |
| Welcome (7 emails + 2 SMS) | none | **Build** (priority 1) |
| Abandoned cart (4 emails + 2 SMS) | none | **Build** (priority 2) |
| Post-purchase (4 emails + 1 SMS) | none | **Build** (priority 3) |
| Browse abandonment (3 emails + 1 SMS) | none | **Build** (priority 4) |
| Site abandonment (2 emails) | none | **Build** (priority 5) |
| Winback (2 emails + 1 SMS) | none | **Build** (priority 6) |
| Replenishment (optional) | none | **Not proposed**: "running low" messaging implies use (SOP §9) |
| Sunset (optional) | none | Later, once the list is 90+ days old |

**Customer.io prerequisites:** WooCommerce → Customer.io events `placed_order` (with items, order count), `product_viewed`, `added_to_cart`, `checkout_started` (with checkout URL and items), page views (JS snippet), and identify on pop-up submit with attribute `sourcing_interest`. Without them, only Welcome and Winback can run.

## Offer ladder (proposed, HOLD)
| Where | Offer |
|---|---|
| Pop-up, Welcome #1–#4, SMS 1 | W = 10% off first catalog order, code WELCOME10 |
| Welcome #5 + SMS 2 | 15% for 24 hours, code WELCOME15 |
| Site abandonment | none (mention WELCOME10 if unused) |
| Browse #2–#3 | 10%, code BROWSE10 |
| Abandoned cart #3–#4 | "Up to 25% off" teaser, real 15%, code MYSTERY |
| Post-purchase #2, #4 | 15% second order, code NEXTLOT15 |
| Winback #1–#2 | 20%, code WELCOMEBACK20 |
All codes exclude do-not-feature products and can't be combined.

---

## Opt-in pop-up (4 steps) — Build
- **Step 1:** "Want 10% off your first catalog order?" Question: *What are you sourcing?* → **Single compounds** · **Blends** · **Larger sizes** (stored as `sourcing_interest`). Answers are formats, never effects. Creative: real vial on a lab-white field.
- **Step 2:** "Where should we send it?" Sub: "10% off your first order, plus the COA library link so you can check every report." Email. Button: Continue.
- **Step 3:** "Want it texted to you too?" Sub: "Shipping updates and new COA postings. A few texts a month." Phone · "Yes, text me" · "No thanks, email is fine" · consent line (plus the approved RUO SMS disclosure once provided).
- **Step 4:** "You're in." Sub: "Your code is WELCOME10 for 10% off the catalog. It's in your inbox now." Button: Explore Research Catalog.
- Show only after the site's age gate/research-use attestation. Why this question: it maps to real product groups for Email #1 and is reused in campaigns.

## Welcome flow (7 emails + 2 SMS) — Build
**Build sheet:** Trigger: person identified via pop-up (attribute `sourcing_interest` set). Filter: no `placed_order` since entry (exit on `placed_order`). Re-entry: no. Branch on `sourcing_interest` for Email #1; #2–#5 shared. Conversion goal: `placed_order` within 5 days of an email.

| # | Timing | Topic | Format | Offer | Goals |
|---|---|---|---|---|---|
| 1 (Single compounds) | immediately | "Welcome to Formera. Your 10% and where the COAs live" | Designed | WELCOME10 | Talking to the small-lab buyer comparing vendors' COAs. Code; mission in the brand's words ("get quality research compounds to everyone who needs them"); how to find any product's COA; 3 approved single compounds (proposed: BPC-157 10 mg, KPV 10 mg, TB-500 10 mg) each with View COA; disclaimer in body. |
| 1 v2 (Blends) | immediately | same | Designed | WELCOME10 | Same message; products: GLOW, KLOW, BPC-157 / TB-500 10/10 (names only, no expansion of what they're for). |
| 1 v3 (Larger sizes) | immediately | same | Designed | WELCOME10 | Same message; products: NAD+ 1000mg, Epithalon 50mg, SS-31 50mg (if approved); the free-shipping-over-$200 line fits this group. |
| 2 | +4 hours | "A note from [owner]" | **Plain text** | soft WELCOME10 | Who's behind Formera, why they keep prices fair and the reports on file, invite a reply, phone and hours. |
| 3 | +1 day | "What buyers say about ordering from us" | Designed | WELCOME10 | Real reviews about speed, service and price only ("shipped my order same day", "great customer service", "best prices i've seen online!", Trustpilot). Review count only once the 55-vs-4 conflict is resolved. |
| 4 | +1 day | "Our most-ordered compounds" | Designed | WELCOME10 | 4 approved best sellers as image + name + size + View COA; latest COA date on each tile; easiest place to start = the most-documented product. |
| 5 | +1 day | "Your offer went up, for 24 hours" | Designed | WELCOME15, 24h | First direct ask; numbers-led hero; free shipping over $200; exclusions. |

SMS 1 (with Email #1): "Formera Research: your 10% code is WELCOME10. Every product's COA: [link] Reply STOP to opt out."
SMS 2 (with Email #5): "Formera Research: 24 hours only, WELCOME15 takes 15% off your first catalog order. [link] Reply STOP to opt out."

## Site abandonment (2 emails) — Build
**Build sheet:** Trigger: page view event (site visit) by an identified person. Filters: no `product_viewed`, `added_to_cart`, `checkout_started` or `placed_order` since entry; not in Browse or Cart flows. Re-entry: after 7 days. Goal: `placed_order` within 5 days.

| # | Timing | Topic | Format | Offer | Goals |
|---|---|---|---|---|---|
| 1 | +2 hours | "Were you checking us out?" | Designed | none (WELCOME10 if unused) | What Formera is in one line, COA library first, shipping and support facts; CTA Explore Research Catalog or reply with a question. |
| 2 | +1 day | "Where most buyers start" | Designed | none | Approved best sellers, one factual line each (size, latest COA date); View COA buttons. |

## Browse abandonment (3 emails + 1 SMS) — Build
**Build sheet:** Trigger: `product_viewed`. Filters: no `added_to_cart`, `checkout_started`, `placed_order` since entry; not in Cart flow; viewed product not on the do-not-feature list (filter on product id). Re-entry: 7 days. Goal: `placed_order` within 5 days.

| # | Timing | Topic | Format | Offer | Goals |
|---|---|---|---|---|---|
| 1 | +2 hours | "Still comparing?" | Designed, dynamic viewed product | none | The viewed product + its COA link and report count; why buyers choose Formera on verifiable points (COA on file, ships fast, phone support). No benefits for what they viewed (SOP §9). |
| 2 | +1 day | "What buyers say about us" | Designed, dynamic | BROWSE10 | Service/shipping/price reviews; free shipping over $200; code. |
| 3 | +1 day | "Your 10% ends tonight" | Designed, dynamic | BROWSE10 expires | Viewed product still in stock; code expires tonight. |

SMS 1 (after Email #2): "Formera Research: the COA for {{event.product_name}} is on file here: {{event.url}} Reply STOP to opt out."

## Abandoned cart (4 emails + 2 SMS) — Build
**Build sheet:** Trigger: `checkout_started`. Filter: no `placed_order` since entry. Re-entry: after 1 day. Exit Browse/Site flows on entry. Goal: `placed_order` within 5 days. Do-not-feature products: suppress the flow if the cart contains them (until cleared).

| # | Timing | Topic | Format | Offer | Goals |
|---|---|---|---|---|---|
| 1 | +30 min | "You left this in your cart" | Designed, dynamic cart table | none | Headline → sub → button → cart table → button. Simple. |
| 2 | +1 day | "Before you check out: the paperwork" | Designed, dynamic | none | COA link for each cart item, shipping times, support line; the item most often ordered with it (needs order data). |
| 3 | +1 day | "Grab your MYSTERY discount" | Designed, dynamic | "Up to 25% off", real 15%, code MYSTERY | Excitement; code reveals at checkout; exclusions. |
| 4 | +1 day | "Your mystery discount ends at midnight" | Designed, dynamic | MYSTERY expires | Deadline; cart table; one checkout button. |

SMS 1 (with Email #1): "Formera Research: your cart is saved. Finish checking out: {{event.checkout_url}} Reply STOP to opt out."
SMS 2 (with Email #3): "Formera Research: your mystery discount is waiting. Code MYSTERY at checkout: {{event.checkout_url}} Reply STOP to opt out."

## Post-purchase (4 emails + 1 SMS) — Build
**Build sheet:** Trigger: `placed_order` where order count = 1. Re-entry: no. Goal: second `placed_order` within 30 days.

| # | Timing | Topic | Format | Offer | Goals |
|---|---|---|---|---|---|
| 1 | +5 min | "Thank you, {{customer.first_name}}" | **Plain text, from the owner** | none | Thanks; when it ships and how (USPS, 2–6 business days); support hours and phone; doesn't duplicate WooCommerce's receipt. |
| 2 | +1 day | "The COA for your order" | Designed, dynamic items | NEXTLOT15 below | RUO replacement for the "how to use" email: links to the COA for each item ordered, how to match the lot on the label to the report, what to do if anything looks off. Storage-on-arrival facts only if the client supplies verified specs. No use, prep or handling-for-use content. Code below. |
| 3 | +7 days | "Did the COA check out?" | **Plain text, from the owner** | none | The check-in only Formera can ask; review request (Trustpilot) about ordering, shipping and service; invite a reply so problems get caught early. |
| 4 | +2 days | "Most often ordered with yours" | Designed | NEXTLOT15 with expiry | Pairing map from order data (bought X → Y, Z), formats only; free shipping over $200 as the basket builder. Needs the order export. |

SMS 1 (with Email #2): "Formera Research: thanks for your order. The COA for each item is here: [link] Reply STOP to opt out."

## Winback (2 emails + 1 SMS) — Build
**Build sheet:** Trigger: `placed_order` with order count = 1; wait **90 days** (default; set from the order export's median days to second order); filter: no `placed_order` since entry. Re-entry: no. Goal: `placed_order` within 5 days.

| # | Timing | Topic | Format | Offer | Goals |
|---|---|---|---|---|---|
| 1 | +90 days | "What's new since your last order" | Designed | WELCOMEBACK20 | News, not need: new lots with newly published COAs, catalog additions; a reorder block of what they bought (approved products only); "tell us if something went wrong" link. Never "running low", "next cycle" or "keep your progress" (SOP §9). |
| 2 | +5 days | "Your 20% ends soon" | Designed | WELCOMEBACK20 expires | Same code with clear expiry; approved best sellers; one CTA. |

SMS 1 (with Email #1): "Formera Research: new lots and new COAs are in since your last order. 20% off with WELCOMEBACK20: [link] Reply STOP to opt out."

---

## Counts
Emails: Welcome 7 · Site 2 · Browse 3 · Cart 4 · Post-purchase 4 · Winback 2 = **22**.
SMS: Welcome 2 · Browse 1 · Cart 2 · Post-purchase 1 · Winback 1 = **7** (all HOLD until the SMS disclosure and consent flow are approved).

## Blocking before build
1. Legal classification A and the approved product list (compliance.md §1).
2. Approved disclaimer + SMS disclosure; approved promotions and codes.
3. Customer.io account and the WooCommerce event connection.
4. Owner's name for the plain-text notes; sample COA + vial photos; 90-day order export.
