# Panacheeza — Flow Plan
_Prepared 2026-11-26 · Status: draft, needs client approval · Version: replenishable (CPG food)_

**The plan in one line:** keep the flows that earn, fix the two leaking ones (post-purchase and abandoned checkout), and steer every first order toward the refill bag and subscribe & save.

**Core system:** 22 emails + 7 SMS
- Pop-up (4 steps) + Welcome · 7 emails + 2 SMS
- Site Abandonment · 2 emails
- Browse Abandonment · 3 emails + 1 SMS
- Abandoned Cart · 4 emails + 2 SMS
- Post-Purchase · 4 emails + 1 SMS
- Winback · 2 emails + 1 SMS

**How to read the marks**
- **Keep:** live and earning, leave as is
- **Fix:** live, but rewrite or restructure the email(s)
- **Build:** missing, create it
- Email-level marks assume the live flows don't have the piece described. Verify in Klaviyo before building; the audit shows flow totals, not each email.

---

## Live flows vs the core system

| Flow | Live? | Last 60 days | Mark |
|---|---|---|---|
| Pop-up (desktop + mobile) | Yes | submit rate not in audit | Fix: add the 3-answer question |
| Welcome | Yes | $2,255 · $0.67 RPR · 61 orders | Keep core, fix email 1 versions + #5 |
| Site Abandonment | Yes | $433 · $0.21 RPR | Keep |
| Browse Abandonment | Yes | $307 · $0.36 RPR | Fix |
| Abandoned Checkout | Yes | $697 · $0.88 RPR | Fix |
| Post Purchase | Yes | $254 · $0.07 RPR on 3,901 | Fix (biggest gap) |
| Winback | Yes | no revenue in 60 days | Fix timing and offer |
| BFCM Offer Code | Yes | $58 | Turn off after Cyber Monday (client does this in Klaviyo) |
| Replenishment (optional) | No | — | Build (proposed) |
| Sunset (optional) | No | — | Build later (proposed) |

---

## Offer ladder (all proposals, max 15%)
- **Pop-up, Welcome #1–#4, SMS #1:** 10% off first order · WELCOME10 (already exists)
- **Welcome #5 + SMS #2:** 15% for 24 hours · WELCOME15 (already exists)
- **Site Abandonment:** none · welcome code only if still unused
- **Browse #2–#3:** 10% · BROWSE10 (new)
- **Abandoned Cart #3–#4:** mystery discount, real 15% · MYSTERY (already exists)
  - Teaser says "a mystery discount", never "up to 30%", since 15% is the cap
- **Post-Purchase #2 and #4:** subscribe & save first · fallback 10% · NEXT10 (new)
- **Winback:** 15% (the ceiling) · COMEBACK15 (new)
- Codes can't be combined with other offers.

**Data behind the timing**
- Median days to second order: 106 · fast quarter: 61 (order data)
- 64% of reorders are the same product
- First orders: Original shaker 509 · 1 lb bag 190 · Tasting Trio 154

---

## Opt-in Pop-up (4 steps) · Fix

**Step 1: Teaser + question**
- Headline: Want 10% off your first shaker?
- Question: What brings you to Panacheeza?
  - "I'm dairy-free and miss real parmesan"
  - "I want cleaner ingredients"
  - "I go through a lot of parm"
- Creative: the red-cap Original shaker over a plate of pasta
- Stored as `popup_reason`

**Step 2: Email**
- Headline: Where should we send it?
- Sub: 10% off your first order, plus quick recipes our customers love
- Button: Continue

**Step 3: SMS (skippable)**
- Headline: Want it texted to you too?
- Sub: Restock alerts, new flavors and early access. A few texts a month.
- Button: Yes, Text Me · secondary: No thanks, email is fine
- Consent: "By submitting you agree to receive recurring automated marketing texts. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to cancel."

**Step 4: Confirmation**
- Headline: You're in.
- Sub: Your code is WELCOME10 for 10% off your first order. It's in your inbox now.
- Button: Shop Original

**Why this question:** each answer maps to an avatar and a starting product, so Welcome #1 opens on their reason, not ours.

---

## Welcome Flow · 7 emails + 2 SMS · Keep core, Fix email 1 + #5
- **Trigger:** added to the pop-up list (Newsletter)
- **Filter:** placed order zero times since starting this flow
- **Split:** on `popup_reason` → #1 / #1 v2 / #1 v3, then #2–#5 shared

**Email #1: "I miss real parmesan" · immediately · Build (version)**
- Subject idea: Pasta night is back
- Offer: WELCOME10, 10% off
- Goals:
  - Welcome and the code above the fold
  - "Tastes like the parmesan you grew up with": Janessa's Italian family story in one line
  - Products: Original shaker · 1 lb Bulk Bag · Tasting Trio
  - 4.9 stars from 500+ reviews

**Email #1 v2: "Cleaner ingredients" · immediately · Build (version)**
- Subject idea: 5 ingredients. Read them all.
- Offer: WELCOME10
- Goals:
  - Same welcome and code
  - The 5 ingredients and what's not in it (no preservatives, additives or added MSG)
  - Products: Original shaker · Tasting Trio · Lover Bundle

**Email #1 v3: "I go through a lot" · immediately · Build (version)**
- Subject idea: Your shaker, refilled for less
- Offer: WELCOME10
- Goals:
  - Same welcome and code
  - Shaker + bulk refill, price per ounce, shelf-stable 18 months unopened
  - Products: 1 lb Bulk Bag · 3 lb Bulk Bundle · Original shaker
  - Subscribe & save as the "never run out" option

**SMS #1 · right after Email #1 · Keep (verify copy)**
- "Welcome to Panacheeza! Here's 10% off your first order: WELCOME10. Shop: [link]"

**Email #2: A note from Janessa · 4 hours · Fix (plain text)**
- Plain text, from Janessa
- The spoonful of parmesan in her family's kitchen, and why she gave it up
- Why only 5 ingredients, and the manufacturers she turned down
- Invite a reply · soft reminder of WELCOME10

**Email #3: What people are saying · 1 day · Keep (verify)**
- 4.9 stars from 500+ reviews
- Reviews that answer "does it really taste like parmesan?"
- Reminder of WELCOME10

**Email #4: Our best sellers · 1 day · Keep (verify)**
- Original first, then Truffle and Hot & Spicy as "when you're ready"
- Tasting Trio as the easy way to try all three
- One line each on how people use it

**Email #5: Your offer went up, for 24 hours · 1 day · Fix**
- WELCOME15, 15% for 24 hours, exact end time
- Original shaker + 1 lb bag as the smart first order
- Subscribe & save mention

**SMS #2 · right after Email #5 · Build**
- "24 hours only: your Panacheeza offer is now 15% off with WELCOME15. [link]"

---

## Site Abandonment · 2 emails · Keep
- **Trigger:** active on site · no product view, cart, checkout or order
- **Re-entry:** 7 days · not in Browse or Cart flow

**Email #1: Were you just checking us out? · 2 hours · Keep**
- Dairy-free parmesan that actually tastes like parmesan, in 5 ingredients
- 4.9 stars · first-visitor questions (taste, shelf life, cashews)
- WELCOME10 only if still unused

**Email #2: Take a look at our best sellers · 1 day · Keep**
- Original shaker · 1 lb Bulk Bag · Tasting Trio
- One line each on what it's for

---

## Browse Abandonment · 3 emails + 1 SMS · Fix
- **Trigger:** viewed product · no cart, checkout or order · not in the Cart flow

**Email #1: Still thinking about this? · 2 hours · Keep (verify)**
- Dynamic viewed product
- Why it beats the alternatives: flavor first, 5 ingredients, no fillers

**Email #2: Everyone is loving Panacheeza · 1 day · Fix**
- Reviews tied to the viewed flavor
- BROWSE10, 10% off
- Bulk bag as the better value if they viewed a shaker

**SMS #1 · right after Email #2 · Keep (verify)**
- "Still thinking about {{ProductName}}? It's waiting for you: [link]"

**Email #3: Your 10% ends tonight · 1 day · Build**
- Same viewed product
- BROWSE10 expires at midnight

---

## Abandoned Cart · 4 emails + 2 SMS · Fix
- **Trigger:** started checkout · exit on order · re-entry after 1 day

**Email #1: I think you forgot this… · 30 minutes · Keep (verify)**
- Headline → sub → button → cart table → button
- No discount

**SMS #1 · right after Email #1 · Keep (verify)**
- "You left something in your Panacheeza cart. Finish checking out: [link]"

**Email #2: Here's what people are saying · 1 day · Fix**
- Cart table
- Reviews for what's in the cart
- Attach item: shaker in cart → add a 1 lb refill bag (top path)

**Email #3: Grab your mystery discount · 1 day · Build**
- "Your mystery discount is waiting": MYSTERY reveals 15% at checkout
- Cart table, one button

**SMS #2 · right after Email #3 · Build**
- "Your mystery discount is waiting. Use MYSTERY at checkout: [link]"

**Email #4: Last chance for your mystery discount · 1 day · Build**
- MYSTERY expires at midnight
- Cart table, one checkout button

---

## Post-Purchase · 4 emails + 1 SMS · Fix
- **Trigger:** placed order · first-time customers only · once

**Email #1: Thank you from Janessa · 5 minutes · Build (plain text)**
- Plain text, from Janessa
- Thanks for trusting a family recipe
- Shipping timing so nobody has to email support
- Reply to this email with any question

**Email #2: How to get the most from your Panacheeza · 1 day · Fix**
- Store it: shelf-stable unopened, keep it in the fridge after opening (flavor is best cold)
- Use it: finish pasta, popcorn, roasted veg, Caesar
- Save the shaker, refill it with the bulk bag
- Below: subscribe & save, then NEXT10 as the fallback

**Email #3: How's it tasting? · 7 days · Fix (plain text)**
- Plain text from Janessa: "Did it pass the pasta-night test?"
- Ask for a review
- Invite a reply if anything's off · no discount

**SMS #1 · with Email #3 · Build**
- "How's your Panacheeza tasting? Leave a quick review: [link]"

**Email #4: Picked for you · 2 days · Fix**
- Pairing map from order data:
  - Bought the Original shaker → 1 lb refill bag + Truffle
  - Bought a 1 lb bag → 3 lb bundle
  - Bought the Tasting Trio → their favorite flavor in a 1 lb bag
- NEXT10 with a clear end date · subscribe & save as the better standing deal

---

## Winback · 2 emails + 1 SMS · Fix
- **Trigger:** placed order · first-time customers who never reordered
- **Timing:** day 120, just past the 106-day median second order

**Email #1: We miss you · 120 days · Fix**
- What's new (Truffle, Hot & Spicy, bundles)
- Reorder block with what they bought
- COMEBACK15, 15% off
- Reply if something went wrong

**SMS #1 · with Email #1 · Build**
- "It's been a while! 15% off your next Panacheeza order with COMEBACK15: [link]"

**Email #2: Your 15% ends soon · 5 days · Fix**
- Same code, exact expiry
- 1 lb bag and 3 lb bundle as the value pick
- Subscribe & save so they don't lapse again

---

## Optional flows (proposed)

**Replenishment · 2 emails + 1 SMS · Build**
- Why: 64% of reorders are the same product · fast quarter reorders at 61 days
- Email #1 at day 45 (shaker buyers): "Running low?" · no discount
- SMS: reorder reminder
- Email #2 six days later: 10% restock code, 72 hours · subscribe & save
- Bulk-bag buyers: day 75

**Sunset · 3 emails · Build later**
- Why: full-list sends open at 33–35% vs 60% on the engaged audience
- Re-engage the unengaged 120 days, then suppress non-clickers

---

## Flow rules
- A purchase exits Welcome, Site, Browse and Cart
- One retargeting flow at a time: Cart beats Browse, Browse beats Site
- SMS only to contacts with SMS consent
- B2B Contacts and outreach lists never enter consumer flows
- Never above 15% · codes can't be combined

## Needs approval
1. The offer ladder and new codes (BROWSE10, NEXT10, COMEBACK15)
2. Subscribe & save discount and which products it covers
3. Mystery teaser wording without "up to 30%"
4. Janessa signing the plain-text emails
