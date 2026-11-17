# Arq8 — Core flow plan
_Prepared 2026-11-17 · Replenishable version · 22 emails + 7 SMS · From: Claire from Arq8 (proposed); founder notes from the founder (name needed) · Every offer proposed until approved · Status: needs approval_

**What's live today (Klaviyo, last 60 days):** SMS Welcome $17,829 ($1.40 RPR), Email Welcome $15,335 ($0.31), Opensend Welcome $1,809 ($0.04 on 40,943), Abandoned Checkout $894 ($0.71), Abandoned Cart $1,114, Site Abandonment $701, Browse Abandonment, Thank You $535, Shipment Delivered $2,732, Reactivation, SKIO Cancellation + Payment Reanimation. We rebuild the six core flows below and turn the old versions off only when each new one is live. SKIO flows stay as they are. The Opensend track gets a shorter version of the welcome (Emails #1, #3, #5) and a sunset after 90 days with no engagement.

**What the data says the flows must do:** gummies are 83% of revenue and the first-order product; 55% of first-time buyers reorder, median day 31 (p75 day 61), 88.6% the same product → teach daily use for 28 days, push subscription, time the winback at day 60. Free gifts (Longevity Guides, bottle, travel case) already ride on first orders; other products are upsells or gifts (form).

## Offer ladder (max 20%)
| Where | Offer (proposed) |
|---|---|
| Pop-up, Welcome #1–#4, Welcome SMS 1 | WELCOME — 15% off first order (confirm current value) |
| Welcome #5 + SMS 2 | WELCOME20 — 20% for 24 hours |
| Site Abandonment | None (welcome code if they hold it) |
| Browse #2–#3 + SMS | BROWSE15 — 15%, expires after #3 |
| Abandoned Cart #3–#4 + SMS 2 | MYSTERY — "Unlock your mystery discount", real 20% (no inflated teaser: max is 20%) |
| Post-Purchase #2 / #4 | Subscribe & save first (≈24% under one-time); fallback NEXT15 — 15% second order |
| Winback #1–#2 + SMS | COMEBACK20 — 20%, 5-day expiry |

---

## Opt-in Pop-up (4 steps)
- **Step 1 — Headline:** Want 15% off your first order? · **Question:** What do you want creatine to help with? → **Stay strong as I get older** · **Sharper focus and steadier energy** · **Better results from my workouts** (stored as `goal`). Creative: the two gummy jars, strawberry + mango, floating gummies.
- **Step 2 — Headline:** Where should we send it? · **Sub:** 15% off your first order, plus the 28-day guide to getting results. · Email · CONTINUE
- **Step 3 — Headline:** Want it texted to you too? · **Sub:** Early access to sales and new flavors. A few texts a month. · Phone · YES, TEXT ME / No thanks, email is fine · TCPA consent line.
- **Step 4 — Headline:** You're in. · **Sub:** Your code is WELCOME for 15% off your first order. It's in your inbox now. · SHOP THE GUMMIES
- **Why this question:** it maps to the form's three customer groups (healthy ageing / brain & energy / training) and the near 50/50 women/men split, and the answer personalises Email #1 and later campaigns.

## Welcome Flow (7 emails + 2 SMS)
Trigger: added to Email List via pop-up · Filter: placed order 0 times since starting · Re-entry: once.

**Email #1 — Stay strong as I get older** (immediately)
Topic: "Welcome to Arq8. Here's your 15%." Goals: welcome; code WELCOME, 15%; the mission (creatine as normal as coffee, made for everyday people, not gym bros); her/his problem in their words — losing strength and firmness after 40, slower recovery, worrying about staying independent — and how daily creatine helps hold muscle; products: Gummies (start here), Creatine + Magnesium Gummies, Variety Pack; trust strip (Informed Sport, CLP, zero sugar, 30-day guarantee). Designed.

**Email #1 v2 — Sharper focus and steadier energy** (immediately)
Same offer and mission; benefit paragraph: your brain runs on creatine too — focus under stress, short nights, no stimulants; products: Gummies, Magnesium+ Gummies (evening/sleep), HYDRO Electrolytes. Designed.

**Email #1 v3 — Better results from my workouts** (immediately)
Same offer and mission; benefit paragraph: strength, recovery and getting past plateaus, without the bloat and grit of old powders; products: Gummies, Nano-Creatine Powder, Creatine + Magnesium Gummies. Designed.

**SMS 1** (right after #1): "Welcome to Arq8, {first_name}. Here's 15% off your first order: WELCOME {link} Reply STOP to opt out"

**Email #2 — A note from the founder** (4 hours) — plain text, signed by the founder: why Arq8 exists (creatine helped more than gym performance; every option was gritty, chalky, bloating or sugar-coated, and spoke only to gym bros); the decision made on purpose (Swiss particle refinement, 99.9% purity, zero sugar even though it costs more); invite a reply; soft reminder of WELCOME.

**Email #3 — What people are saying** (1 day) — real reviews in situation → problem → experience → outcome form, 500+ five-star reviews; answers the category doubt "will it bloat / taste chalky?"; WELCOME reminder. Designed. Needs the reviews folder.

**Email #4 — Where to start** (1 day) — Gummies (what most people start with), Variety Pack (can't choose a flavor), Powder (prefer to mix it), Creatine + Magnesium (strength + sleep); the easiest start: 1 pack subscribed, 4 gummies a day; WELCOME reminder. Designed.

**Email #5 — Your offer just went up, for 24 hours** (1 day) — WELCOME20, 20% for 24 hours, stacks on subscribe pricing (confirm); 28-day framing: "start today, full levels by {date}". Designed.

**SMS 2** (right after #5): "24 hours only: your Arq8 offer is now 20% off with WELCOME20. {link} Reply STOP to opt out"

## Site Abandonment (2 emails)
Trigger: Active on Site · Filter: no product view, cart, checkout or order since starting; not in Browse/Cart · Re-entry: 7 days.
- **Email #1 — Were you just checking us out?** (2 hours): "Creatine never failed you. The delivery did." — the FullDissolve™ story in three lines, the first-visitor questions (what is it, is it for me if I don't lift, how many a day), proof strip. No offer (WELCOME if they hold it). Designed.
- **Email #2 — Our best sellers** (1 day): Gummies (strawberry, mango), Variety Pack, Creatine + Magnesium — the problem each solves in one line. Designed.

## Browse Abandonment (3 emails + 1 SMS)
Trigger: Viewed Product · Filter: no cart, checkout or order since starting; not in Cart · Re-entry: 7 days.
- **Email #1 — Still thinking about this?** (2 hours): dynamic viewed product; why it beats the alternatives — fully dissolves (no grit, chalk or bloat), zero sugar, 99.9% purity, Informed Sport + CLP. Designed.
- **Email #2 — Everyone is loving Arq8** (1 day): reviews for the viewed product, 30-day money-back guarantee, BROWSE15 (15%). Designed.
- **SMS** (after #2): "Still thinking about {product}? 15% off with BROWSE15: {url} Reply STOP to opt out"
- **Email #3 — Sh… don't tell anyone about this** (1 day): viewed product waiting, BROWSE15 expires tonight. Designed.

## Abandoned Cart (4 emails + 2 SMS)
Trigger: Started Checkout · Filter: placed order 0 times since starting · Re-entry: 1 day.
- **Email #1 — I think you forgot this…** (30 min): headline → sub → CHECK OUT → dynamic cart → CHECK OUT. No discount.
- **SMS 1** (after #1): "You left something in your cart at Arq8. Finish checking out: {checkout_url} Reply STOP to opt out"
- **Email #2 — What people are saying about Arq8** (1 day): dynamic cart; reviews for the gummies; attach item: Magnesium+ (second-most units sold, 2,449 in 90 days) or the Variety Pack; guarantee. Designed.
- **Email #3 — Grab your MYSTERY discount** (1 day): "Your mystery discount is waiting" — code MYSTERY reveals 20% at checkout; dynamic cart. Designed.
- **SMS 2** (after #3): "Your Arq8 mystery discount is waiting. Use MYSTERY at checkout: {checkout_url} Reply STOP to opt out"
- **Email #4 — Last chance for your mystery discount** (1 day): MYSTERY expires at midnight; dynamic cart; one CHECK OUT button. Designed.

## Post-Purchase (4 emails + 1 SMS)
Trigger: Placed Order · Filter: first order ever · Re-entry: once. Replaces Thank You - N8; Shipment Delivered stays (transactional).
- **Email #1 — Thank you, {first_name}** (5 min): plain text from the founder; thanks for trusting Arq8; shipping expectations; "reply if anything's off"; no offer.
- **Email #2 — How to get results from your gummies** (1 day): the email that protects the reorder — 4 gummies a day, any time, with or without food, every day incl. rest days, no loading; what to expect at week 1, 2, 4 (≈28 days to build up); habit tips (next to the coffee, travel case). Below: switch to subscribe (≈24% less, never run out); fallback NEXT15. Designed.
- **Email #3 — How's it going?** (7 days): plain text from the founder — "Have you managed every day so far?"; ask for the review; invite a reply so problems are caught early. No offer.
- **Email #4 — What goes with your gummies** (2 days): pairing map from the orders — Gummies → Magnesium+ (evening recovery/sleep), → Variety Pack (new flavor), → Powder (for coffee/shakes); subscribe as the standing deal; NEXT15 with a 7-day expiry. Designed.
- **SMS** (day 24 after order): "Day 24 with Arq8. You're nearly at full levels; don't break the streak now. Running low? Reorder or subscribe: {link} Reply STOP to opt out" (only if not subscribed)

## Winback (2 emails + 1 SMS)
Trigger: Placed Order · Filter: first order only, no order since starting · Re-entry: once · Wait: **60 days** (p75 of days to 2nd order is 61; median reorderers are back by day 31).
- **Email #1 — We miss you, {first_name}** (day 60): creatine levels fade a few weeks after stopping; what's new (Variety Pack, Magnesium+, electrolytes); reorder block with their last product; COMEBACK20 (20%); "reply if something wasn't right". Designed.
- **SMS** (with #1): "It's been a while, {first_name}. Restart your Arq8 routine with 20% off: COMEBACK20 {link} Reply STOP to opt out"
- **Email #2 — Your offer expires soon** (5 days): COMEBACK20 ends tonight; gummies + 3-pack; subscribe so they don't lapse again. Designed.

## Recommended next (optional, not in the 22)
- **Replenishment** (2 emails + 1 SMS) at day 26 for one-time buyers not on subscription — 88.6% reorder the same product at a median 31 days.
- **Sunset** for the Opensend and unengaged-120 contacts.

## Open questions
- Founder's first name for the plain-text emails.
- Confirm WELCOME's current value and approve the ladder (15 / 20 / 15 / 20 / 15 / 20).
- Can codes stack on subscribe pricing outside BF20?
- Exact grams per 4-gummy serving.
