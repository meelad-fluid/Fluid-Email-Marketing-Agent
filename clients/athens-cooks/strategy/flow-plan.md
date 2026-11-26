# Athens Cooks — Flow plan
Status: draft · needs approval · prepared 2026-11-26

**The plan:** 22 emails and 7 SMS across six core flows, built as the one-off (durable goods) version.
- Two leaks to fix first:
  1. Abandoned cart is mailing about 14× real checkout volume for $0.05 RPR
  2. Welcome reached only 10 people in 60 days while TENOFF drove $10,380
- Every live flow is marked **Keep**, **Fix** or **Build**

**Ground rules**
- **From:** Lucy from Athens Cooks (proposed). Founder emails come from Courtney and Grady
- **Max discount is 10%** (brief). Most brands are MAP-restricted, so the ladder uses free shipping and gifts instead of bigger percentages. Every offer is a proposal
- **One retargeting flow at a time:** Cart beats Browse, and Browse beats Site Abandonment
- **A purchase exits** Welcome and all abandonment flows. Smart Sending is off
- Every email with a code states "Some exclusions apply" and lists the excluded brands

## Live flows vs the core system (Klaviyo, last 60 days)

| Live flow | Result | Verdict |
|---|---|---|
| FC \| Welcome (Cookware / Baking / Table + Bar) | 10 recipients, $48 | **Fix:** merge into one flow with a pop-up split |
| — Site Abandonment | missing | **Build** |
| FC \| Browse Abandonment | 97 recipients, $0 | **Fix** |
| FC \| Abandoned Cart | 14,595 recipients, $712, RPR $0.05 | **Fix first** |
| FC \| Post Purchase | 1,821 recipients, $3,654, RPR $2.01 | **Keep:** add the founder emails and class version |
| FC \| Winback 90d | no volume in 60 days | **Fix:** check the trigger, keep the 90-day timing |

**Offer ladder (proposed)**
- **Pop-up, Welcome #1–#4:** TENOFF, 10% off the first order
- **Welcome #5:** 10% plus free shipping on any order, 24 hours (we can't go above 10%)
- **Site abandonment:** none
- **Browse #2–#3:** none. Free shipping at $199 and expert help instead, plus TENOFF if they still hold it
- **Cart #3–#4:** mystery offer. Teaser "a surprise with your order"; real offer 10% off plus Le Bon Garçon caramels (the #1 first-order product), code MYSTERY
- **Post-purchase #2 and #4:** 10% off the next order, 14-day expiry (the median second order comes at 18 days)
- **Winback:** 10% or $15 off $150, whichever the client prefers

---

## Pop-up (Fix: keep "FC | Pop Up", rework the steps)
- **Step 1:** "Want 10% off your first order?" + "What are you shopping for?"
  - Cookware
  - Baking
  - Table + Bar
  - These match the live welcome flows
  - Saved as `shopping_for`
- **Step 2:** "Where should we send it?" + "10% off your first order, plus first word on cooking classes and in-store events."
- **Step 3:** SMS opt-in: "Want it texted too? Class drops and restock alerts, a few texts a month."
  - Skippable, with the consent line
- **Step 4:** "You're in." + "Your code is TENOFF for 10% off. Some exclusions apply."
  - Button: "Shop Cookware" (or the group they chose)
- **Check:** the form must add people to the list that triggers the welcome flow. Only 10 people entered in 60 days

## Welcome flow (7 emails + 2 SMS) — Fix
- **Trigger:** added to the pop-up list
- **Filter:** placed order zero times since starting the flow
- **Split:** `shopping_for`
- **Now:** three separate flows with near-zero entries
- **Change:** one flow, three versions of email #1. Emails #2–#5 are shared

**Email #1 (Cookware): Welcome + TENOFF** — Fix (rewrite from the live Cookware welcome)
- **When:** immediately
- **Goals:**
  - Welcome and give the code: TENOFF, 10%, with exclusions
  - The mission in one line: everything chosen by a family who'd use it
  - The cookware promise: pieces that last, from makers we trust
  - 3 starters, one line each
    - Thermapen ONE
    - Smithey skillet
    - Shun chef's knife
  - Free shipping at $199+
  - "Reply if you're stuck choosing"
- **Design:** designed

**Email #1 v2 (Baking)** — Fix
- **Same structure.** The baking paragraph is the loaf and the pie that come out right
- **Products:**
  - Emile Henry bread cloche or pie dish
  - Hestan OvenBond bakeware
  - Ankarsrum as the splurge

**Email #1 v3 (Table + Bar)** — Fix
- **Same structure.** The paragraph is a table that looks like you planned it
- **Products:**
  - Bergs Pottery
  - Zwiesel glasses
  - Le Bon Garçon caramels as the small gift

**SMS #1** — Build
- **When:** right after email #1
- "Welcome to Athens Cooks! Here's 10% off your first order: TENOFF. [link]"

**Email #2: A note from Courtney and Grady** — Build
- **When:** 4 hours later
- **Format:** plain text
- **Goals:**
  - Why a husband and wife opened a kitchen store on Prince Ave in 2022
  - What we won't carry
  - The invitation to visit, take a class or reply with a question
  - A soft TENOFF reminder

**Email #3: What people say about us** — Build
- **When:** 1 day later
- **Goals:**
  - Real reviews (Google reviews needed): sharpening, classes, service
  - The "done exactly when they said" kind of trust
  - TENOFF reminder
- **Design:** designed

**Email #4: Where to start** — Build
- **When:** 1 day later
- **Goals:**
  - A guided tour by first-order data, each with who it's for
    - Gift card
    - Thermapen
    - Caramels
    - A class
    - Knife sharpening (for locals)
    - Zwiesel glasses
- **Design:** designed

**Email #5: 24 hours: 10% + free shipping** — Build
- **When:** 1 day later
- **To:** non-buyers
- **Goals:**
  - The upgrade: 10% plus free shipping on any order for 24 hours (new code)
  - Exclusions stated
  - "Questions before you order? Reply."
- **Design:** designed

**SMS #2** — Build
- **When:** right after email #5
- "24 hours only: 10% off + free shipping at Athens Cooks with [CODE]. [link]"

## Site abandonment (2 emails) — Build
- **Trigger:** Active on Site
- **Filter:** no product view, cart, checkout or order since starting. Not in Browse or Cart
- **Re-entry:** 7 days

**Email #1: Were you looking for something?**
- **When:** 2 hours later
- **Goals:**
  - What Athens Cooks is: curated kitchen store, café and classes
  - Why people trust it
  - Soft CTA "Shop by what's on your list"
  - TENOFF only if unused

**Email #2: What people start with**
- **When:** 1 day later
- **Goals:**
  - First-order best sellers, one practical line each
    - Gift card
    - Thermapen
    - Caramels
    - Classes
    - Smithey

## Browse abandonment (3 emails + 1 SMS) — Fix
- **Trigger:** Viewed Product
- **Filter:** no cart, checkout or order since starting. Not in Cart
- **Re-entry:** 7 days
- **Check:** onsite tracking. 97 entries in 60 days is too low for this traffic

**Email #1: Still deciding?**
- **When:** 2 hours later
- **Goals:**
  - The viewed product, dynamic
  - It's a considered buy; here's what to know (material, care, size)
  - "Reply and we'll help you choose"

**Email #2: Why people buy it from us**
- **When:** 1 day later
- **Goals:**
  - Reviews
  - In stock, maker's price, shipped by the people who chose it
  - Free shipping $199+
  - TENOFF if unused (no new code because of MAP)

**SMS #1**
- **When:** right after email #2
- "Still thinking about the {{ProductName}}? It's here when you're ready: [link]"

**Email #3: Buy it once**
- **When:** 1 day later
- **Goals:**
  - The "buy right the first time" argument for durable pieces
  - Care and warranty
  - One button back to the product

## Abandoned cart (4 emails + 2 SMS) — Fix first
- **Trigger:** Started Checkout (check it isn't Added to Cart, or counting POS or café tabs)
- **Filter:** placed order zero times since starting
- **Re-entry:** 1 day

**Email #1: Your cart is waiting**
- **When:** 30 minutes later
- **Goals:**
  - Headline, sub, button, cart table, button
  - No discount

**SMS #1**
- **When:** right after email #1
- "You left something in your cart at Athens Cooks. Finish checking out: [link]"

**Email #2: From people who bought it**
- **When:** 1 day later
- **Goals:**
  - Reviews about quality and service
  - Most-paired add-on (gift wrap, caramels, Thermapen)
  - "Reply with questions"

**Email #3: A surprise with your order**
- **When:** 1 day later
- **Goals:**
  - The mystery offer, code MYSTERY: 10% off plus caramels (proposed)
  - Exclusions stated

**SMS #2**
- **When:** right after email #3
- "There's a surprise waiting at checkout. Use MYSTERY at Athens Cooks before it's gone: [link]"

**Email #4: Last chance for your surprise**
- **When:** 1 day later
- **Goals:**
  - The code expires at midnight
  - Cart table
  - One checkout button

## Post-purchase (4 emails + 1 SMS) — Keep, extend
- **Trigger:** Placed Order
- **Filter:** first order
- **Keep:** the live emails earn $2.01 RPR, so keep the best of them and add:
- **Add:** a class-buyer branch (product = class: what to bring, parking, date reminder) in place of #2

**Email #1: Thank you, from Courtney and Grady** — Build (plain text)
- **When:** 5 minutes later
- **Goals:**
  - Personal thanks
  - When it ships
  - "Reply with anything"

**Email #2: Getting the most from it** — Keep (match the live care/use email to this brief)
- **When:** 1 day later
- **Goals:**
  - Care and first-use guide for what they bought (stainless preheat, cast-iron seasoning, knife care)
  - Then the 10% next-order code, 14-day expiry

**Email #3: How did it go?** — Build (plain text)
- **When:** 7 days later
- **Goals:**
  - Ask for a review with a photo
  - Catch problems early
  - Mention sharpening and classes

**Email #4: What goes with it** — Keep or Fix
- **When:** 2 days later
- **Goals:**
  - Pairings: pan + Thermapen, Dutch oven + Emile Henry, knife + board + sharpening
  - Code reminder with expiry

**SMS #1** — Build
- **When:** with email #2
- "Thanks for shopping Athens Cooks! 10% off your next order for 14 days: [CODE] [link]"

## Winback (2 emails) — Fix
- **Trigger:** Placed Order, one-time buyers
- **Wait:** 90 days (p75 to second order is 64 days)

**Email #1: Look what's new on the shelf**
- **Goals:**
  - New arrivals and the class calendar
  - Recommendations from what they bought
  - Winback offer

**Email #2: Your offer ends Sunday**
- **When:** 5 days later
- **Goals:**
  - Same code, exact expiry
  - One button
  - Exclusions

> SMS count across flows: Welcome 2, Browse 1, Cart 2, Post-purchase 1, plus a Winback SMS with email #1: "We've missed you at Athens Cooks. Here's 10% off to come back: [CODE] [link]" = 7.

## Questions for the flows
1. Which brands does TENOFF exclude?
2. Can we go 10% plus free shipping, and use caramels as the mystery gift?
3. Does Klaviyo get in-store (POS) orders? If so, post-purchase and winback need an online-only filter
