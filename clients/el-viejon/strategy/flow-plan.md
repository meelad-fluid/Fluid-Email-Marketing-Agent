# El Viejon — Flow Plan (core system: 22 emails + 7 SMS)
_Prepared Mon Nov 23, 2026 · Status: draft, needs client approval · Version: replenishable (jerky is eaten and rebought)_

**The point:** the welcome flows already earn well; the money is in fixing post-purchase, abandoned cart and winback, and adding a replenishment flow.

**Live flows vs the core system** (Klaviyo, last 60 days)

| Live flow | Revenue · RPR | Verdict |
|---|---|---|
| Pop-up (mobile + desktop, 3 answers) | n/a | **Keep** · check submit rate |
| Welcome #1 · Spicy | $38,204 · $2.43 | **Keep + fix** (add upgrade email and SMS if missing) |
| Welcome #2 · Bold but balanced | $17,419 · $2.80 | **Keep + fix** (same) |
| Welcome #3 · Try everything | $18,093 · $2.03 | **Keep + fix** (Sampler is sold out) |
| Site Abandonment | $4,440 · $0.41 | **Keep** · check filters |
| Browse Abandonment | $14,390 · $0.70 | **Fix** · add the incentive emails |
| Abandoned Checkout | $13,211 · $0.98 | **Fix** · mystery emails (MYSTERY used twice in 90 days) |
| Post Purchase | $13,731 · $0.37 | **Fix** · rebuild for first orders, set shipping expectations |
| 4-Review Request (2024) | $6,871 · $0.37 | **Fix** · fold the ask into Post-Purchase #3, then retire |
| Winback | not in top 8 | **Fix** · retime to 60 days |
| Replenishment | none | **Build** (optional, data supports it) |
| Sunset | none | **Build later** (optional) |

_Verdicts are at flow level. Email-level content wasn't in the audit, so each "keep" email gets checked in Klaviyo against the goals below before we touch it._

**Offer ladder (proposed, max 15%)**
- **Welcome (W):** 10% · VIEJON10 (2,040 orders in 90 days)
- **Welcome #5 upgrade:** 15% for 24 hours · VIEJON15 (exists)
- **Site abandonment:** none
- **Browse #2–#3:** 10% · new code (e.g. MIRALO10)
- **Cart #3–#4:** mystery discount, revealed as 15% · MYSTERY (exists) · no "up to 30%" teaser, since that's over the max
- **Post-purchase #2 and #4:** 10% · FAMILIA10 (exists) or a new single-use code
- **Winback:** 15% · new code (e.g. VUELVE15)

**Timing from the data**
- Median 27 days to a second order · 75th percentile 58 days
- 72% of reorders are the same product
- Bags take 7–14 business days to make + 3–5 to ship, so post-purchase timing counts from delivery, not order

---

## Opt-in Pop-up · Keep
- **Step 1 headline:** Want 10% off your first bag?
- **Question:** How do you like your jerky?
  - Spicy. The hotter the better.
  - Bold but balanced.
  - Let me try everything.
- **Step 2:** "Where should we send it?" · 10% off, plus first word on new flavors and restocks
- **Step 3 (SMS, skippable):** "Want it texted to you too?" · restock alerts and drops, a few texts a month · consent line
- **Step 4:** "You're in." · code VIEJON10 · button: Shop Chile Limón
- **Creative:** the black Chile Limón pouch on Ranch Gold, nothing else
- **Check:** submit rate (target 10%+), and that the answer is saved to a profile property for campaigns

---

## Welcome Flow (7 emails + 2 SMS) · Keep + fix
- **Trigger:** added to the pop-up list · split on the pop-up answer (today this runs as three separate flows, which is fine)
- **Filter:** placed order zero times since starting the flow · re-entry off

**Email #1: Spicy track · Keep (verify)**
- Send: immediately
- Topic: "Your 10% is here, and so is the heat"
- Offer: VIEJON10
- Goals:
  - Welcome to the Familia and the grandfather's story in two lines
  - Speak to the heat chaser: "every 'hot' jerky you've tried was mild"
  - Picosa · Picosa Lime · HabaGarlic, one line each with the chiles in it
  - Trust: hand-sliced, small batch, zero preservatives

**Email #1 v2: Bold but balanced track · Keep (verify)**
- Send: immediately
- Topic: "Your 10% is here: start with the one everyone starts with"
- Offer: VIEJON10
- Goals:
  - Same welcome and offer
  - Speak to flavor over fire: real chile and lime, not powder
  - Chile Limón · Original · Mild

**Email #1 v3: Try everything track · Fix**
- Send: immediately
- Topic: "Your 10% is here: build your first lineup"
- Offer: VIEJON10
- Goals:
  - Same welcome and offer
  - Sampler Pack when in stock; while it's sold out, a "pick any four" lineup that hits $75 free shipping
  - Chile Limón · Spicy Teriyaki · Mystery Mini Bites (if it can be bought)

**SMS #1 · Keep (verify)**
- Send: right after Email #1
- Draft: "Welcome to the Familia. Here's 10% off your first order: VIEJON10. Every bag hand-sliced and made to order: [link]"

**Email #2: Note from Pedro · Keep (verify), plain text**
- Send: 4 hours later
- Topic: "Why it's called El Viejon"
- Offer: soft reminder of VIEJON10
- Goals:
  - Plain text from Pedro, never designed
  - Don Pedro Gordillo Sr., the ranch, chores before meals, jerky dried for days
  - The decision on purpose: by hand and made to order, even when it means a wait
  - Invite a reply: "who taught you to love carne seca?"

**Email #3: What the Familia says · Fix (needs real reviews)**
- Send: 1 day later
- Topic: "Here's what the Familia is saying"
- Offer: reminder of VIEJON10
- Goals:
  - Real reviews only, situation → problem → experience → outcome
  - Answer the price doubt: why a hand-made bag costs more than a gas-station one
  - Answer the wait: made fresh, 7–14 business days

**Email #4: Best sellers · Keep (verify)**
- Send: 1 day later
- Topic: "Where most people start"
- Offer: reminder of VIEJON10
- Goals:
  - Chile Limón · Original · Picosa Lime · Picosa (top first-order products)
  - One line each on who it's for · 2oz vs 4.5oz as the better value

**Email #5: Upgrade for 24 hours · Fix (add if missing)**
- Send: 1 day later
- Topic: "Your 10% just became 15%, for 24 hours"
- Offer: VIEJON15, 24 hours
- Goals:
  - First direct ask to shop · the deadline in the headline
  - Lineup idea to clear $75 free shipping

**SMS #2 · Fix (add if missing)**
- Send: right after Email #5
- Draft: "24 hours only: your El Viejon offer is now 15% off with VIEJON15. [link]"

---

## Site Abandonment (2 emails) · Keep
- **Trigger:** Active on Site · no product view, cart, checkout or order since · not in Browse or Cart flow · re-entry 7 days

**Email #1 · Keep (verify)**
- Send: 2 hours later
- Topic: "Were you just checking us out?"
- Offer: none (VIEJON10 only if still unused)
- Goals: grandfather's ranch-style recipe in one line · by hand, small batch · first-timer questions (heat level, wait time)

**Email #2 · Keep (verify)**
- Send: 1 day later
- Topic: "The four flavors people start with"
- Offer: none
- Goals: Chile Limón · Original · Picosa Lime · Picosa, the craving each one fixes

---

## Browse Abandonment (3 emails + 1 SMS) · Fix
- **Trigger:** Viewed Product · no cart, checkout or order since · not in Cart flow · re-entry 7 days

**Email #1: Reminder · Keep (verify)**
- Send: 2 hours later · dynamic viewed product
- Topic: "Still thinking about {{ product }}?"
- Offer: none
- Goals: why this flavor beats store jerky (the chiles, real lime, hand-sliced) · its heat level

**Email #2: Proof + incentive · Fix**
- Send: 1 day later · dynamic
- Topic: "The Familia keeps coming back for this one"
- Offer: 10% browse code
- Goals: reviews for that flavor · $75 free shipping · the made-to-order promise

**SMS #1 · Keep (verify)**
- Send: right after Email #2
- Draft: "Still thinking about {{ product }}? It's waiting for you, and 10% off with [CODE]: [link]"

**Email #3: Code expires · Build**
- Send: 1 day later · dynamic
- Topic: "Your 10% ends tonight"
- Offer: same code, expires at midnight
- Goals: the viewed flavor still waiting · one button

---

## Abandoned Cart (4 emails + 2 SMS) · Fix
- **Trigger:** Started Checkout · no order since · re-entry 1 day

**Email #1: Reminder · Keep (verify)**
- Send: 30 minutes later · dynamic cart
- Topic: "You left your bag behind"
- Offer: none
- Structure: headline → subhead → button → cart table → button

**SMS #1 · Keep (verify)**
- Send: right after Email #1
- Draft: "You left something in your El Viejon cart. Finish checking out: [checkout link]"

**Email #2: Proof · Fix**
- Send: 1 day later · dynamic cart
- Topic: "Here's why it's worth it"
- Offer: none
- Goals:
  - Answer the price objection head-on: what goes into a bag (October's "what your money buys" earned $5,152)
  - Reviews · add-on: Mystery Mini Bites or a second flavor (Chile Limón → Picosa path)

**Email #3: Mystery discount · Build**
- Send: 1 day later · dynamic cart
- Topic: "We left you a mystery discount"
- Offer: MYSTERY, revealed as 15% at checkout
- Goals: excitement and urgency · the code · cart table

**SMS #2 · Build**
- Send: right after Email #3
- Draft: "We left a mystery discount in your El Viejon cart. Use MYSTERY at checkout to see it: [checkout link]"

**Email #4: Last chance · Build**
- Send: 1 day later · dynamic cart
- Topic: "Your mystery discount ends at midnight"
- Offer: same code, midnight expiry
- Goals: cart table · one checkout button

---

## Post-Purchase (4 emails + 1 SMS) · Fix (rebuild)
- **Trigger:** Placed Order · placed order equals 1 over all time (first orders only; today it reaches 37k people) · re-entry off
- **Why rebuild:** $0.37 RPR, and the 7–14 day wait needs explaining before customers email support

**Email #1: Thank you from Pedro · Build, plain text**
- Send: 5 minutes later
- Topic: "Gracias, {{ first_name }}"
- Offer: none
- Goals:
  - Plain text from Pedro · thanks for trusting a family business
  - Set the timeline: we start making your bag now, 7–14 business days, then 3–5 to arrive
  - Reply here with any question

**Email #2: How the Familia eats it · Build**
- Send: 14 days later (around delivery)
- Topic: "Your bag's here. Here's how to eat it."
- Offer: FAMILIA10 below the teaching
- Goals:
  - Lime and Valentina · on a board · in eggs or a michelada
  - Storage: 2–3 months sealed, best within 1–4 weeks of opening
  - Second-order code below the ideas

**Email #3: How's it going? · Build, plain text (replaces the 2024 review flow)**
- Send: 7 days later
- Topic: "Did you finish the bag already?"
- Offer: none
- Goals: plain text from Pedro · ask for the review now · invite a reply if anything went wrong

**SMS #1 · Build**
- Send: with Email #3
- Draft: "Pedro from El Viejon here. How was your first bag? A quick review helps a small family business more than you know: [review link]"

**Email #4: What goes with it · Build**
- Send: 2 days later
- Topic: "Picked for you: what goes with your {{ product }}"
- Offer: FAMILIA10 with a 72-hour expiry
- Goals:
  - Pairing map from the data: Chile Limón → Picosa or Picosa Lime · Original → Chile Limón · Picosa → Chile Limón
  - The Large 4.5oz as the better value · $75 free shipping

---

## Winback (2 emails + 1 SMS) · Fix
- **Trigger:** Placed Order · first-time customers · no order since starting · re-entry off
- **Change:** wait 60 days, not 90 (75% of second orders happen by day 58)

**Email #1: We saved you a bag · Fix**
- Send: 60 days later
- Topic: "We saved you a bag, {{ first_name }}"
- Offer: 15% winback code
- Goals: what's new (Picosa Lime, HabaGarlic, restocks) · their last flavor (dynamic) · "tell us if something went wrong"

**SMS #1 · Build**
- Send: with Email #1
- Draft: "It's been a while, Familia. 15% off your next order with [CODE]: [link]"

**Email #2: Code expires · Fix**
- Send: 5 days later
- Topic: "Your 15% ends Sunday"
- Offer: same code, clear expiry
- Goals: best sellers · one button

---

## Optional, recommended

**Replenishment (2 emails + 1 SMS) · Build**
- Why: median 27 days to reorder, 72% buy the same flavor, 1,193 customers due now
- Email #1 at 25 days: "Running low on {{ product }}?" · no discount · one-click reorder
- SMS with Email #1: "Running low on {{ product }}? Reorder in one tap: [link]"
- Email #2 at 31 days: "Last call before you run out" · 10% for 72 hours

**Sunset (3 emails) · Build later**
- Why: sends to the 44k–50k lists opened 27%–35% vs 45%+ on the engaged list

---

## Flow rules
- A purchase exits Welcome, Site, Browse and Cart
- One retargeting flow at a time: Cart beats Browse beats Site
- Smart Sending off on flows · SMS only with consent
- Anyone who got a discount flow code and didn't buy skips other flow codes for 60 days

## Needs the client
1. Confirm 15% max (BFCM ran 20%)
2. Review app and real reviews for Welcome #3, Browse #2, Cart #2
3. Is Mystery Mini Bites buyable, or a free add-on?
4. Sampler restock date (Welcome v3)
5. Admin to allow Klaviyo drafts so we can build and check the flows
