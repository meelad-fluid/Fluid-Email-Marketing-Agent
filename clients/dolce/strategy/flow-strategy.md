# Dolce Superfoods: Flow Strategy
Status: needs approval · build after Black Friday, starting Wed Dec 2, 2026

_Built 2026-11-22 from Dolce's Klaviyo audit (60 days of flows, pulled Nov 16), 365 days of Shopify orders in Klaviyo (14,762 paid orders), the onboarding form and dolcesuperfoods.com. Every offer amount is proposed for Jeff's approval. Sender: Hannah from Dolce (proposed); founder notes from Jeff Weaver._

**In one line:** Dolce's flows already earn well, so this rebuild keeps what works, points every email at the products new customers actually start with, and times the reorder and winback to Dolce's real 55-day cycle.

**Scope:** 6 core flows plus the Replenishment rebuild. 24 emails, 5 SMS and the pop-up.

## What the data says
- **Dolce is a restock brand.** 26% of 5,815 first-time buyers came back, and 72% of them reordered the exact same product. _(orders, 365d)_
- **The reorder lands around day 55.** Days to second order: 25 (p25), 55 (median), 92 (p75). _(orders, 365d)_
- **New customers start with three groups.** _(first orders, 90d)_
  - Matcha: Ceremonial 172
  - Cacao: Cacao Powder 315 across two listings, Cacao Butter 136, Nibs 129
  - Smoothie and pantry boosts: Blue Spirulina 154, Ceylon Cinnamon 145, Collagen 105, Coconut Water Powder 99
- **Instant Coffee is a smaller starter than the brief suggests.** 103 first orders, $21k in 90 days against Ceremonial Matcha's $204k.
- **Two codes already convert.** DOLCE15 drove 458 orders ($71k) and the mystery code 238 orders ($50k) in 90 days.
- **Flows are already a big earner.** Welcome made $33,943 in 60 days ($7.36 per recipient), and Replenishment $13,456 ($2.12).
- **Baskets are big.** Average order $213, median $106, and 31% of orders are $160 or more.

## Offer ladder (proposed, inside the 20% cap)
- **Pop-up, Welcome #1–#4, SMS #1:** 15% off the first order, code DOLCE15 (keeps the code that already converts)
- **Welcome #5 + SMS #2:** 20% for 24 hours, code WELCOME20
- **Site Abandonment:** no new offer, DOLCE15 mentioned if unused
- **Browse #2–#3:** 15%, code DOLCE15
- **Abandoned Cart #3–#4:** mystery discount, real value 20%, code MYSTERY
  - The teaser stays at "a mystery discount" with no "up to 30%", because 30% breaks the 20% cap
- **Post-Purchase #2 and #4:** 10% on the second order, code AGAIN10, 14-day expiry
- **Replenishment #2:** 15%, code RESTOCK15, 72-hour expiry
- **Winback #1–#2:** 20%, code COMEBACK20, the ceiling
- **Everywhere:** one-time purchases only, codes can't be combined

## Opt-in Pop-up (4 steps)

**Step 1: Teaser + question**
- Headline: Want 15% off your first order?
- Question: What are you stocking up on?
  - Matcha
  - Cacao and baking
  - Smoothie boosts
- Stored as: `stocking_up_on` (reused in campaigns and launches)
- Creative: the Ceremonial Matcha bowl on cream, nothing else competing
- Why these three: they are the groups new customers actually start with (see the data above). Coffee and mushroom shoppers pick the closest match; Welcome #4 shows them the rest of the shop.

**Step 2: Email**
- Headline: Where should we send it?
- Sub: 15% off your first order, plus the guide to picking the right matcha, cacao or smoothie powder.
- Button: Continue

**Step 3: SMS (skippable)**
- Headline: Want it texted to you too?
- Sub: Restock reminders and first dibs on sales. A few texts a month.
- Buttons: Yes, Text Me / No thanks, email is fine
- Consent line: recurring automated marketing texts, consent not a condition of purchase, msg and data rates may apply, reply STOP to cancel

**Step 4: Confirmation**
- Headline: You're in.
- Sub: Your code is DOLCE15 for 15% off your first order (one-time purchases). It's in your inbox now.
- Button: Shop Best Sellers

Target: 10%+ submit rate. Current submit rate not pulled yet.

## Welcome Flow (7 Emails + 2 SMS)
- **Trigger:** added to the pop-up list
- **Filter:** placed order zero times since starting this flow
- **Re-entry:** once only
- **Split:** on `stocking_up_on`, routing to Email #1, #1 v2 or #1 v3

**Email #1: Welcome Offer (Matcha)**
- Send Time: immediately
- Email Topic: Welcome to Dolce! Here's 15% off your first pound of matcha
- Design: Yes
- Sending to: new subscribers who picked Matcha
- Offer: DOLCE15, 15%
- Goals:
  - Welcome them from Hannah, warm and short
  - Give them DOLCE15 above the fold
  - The mission: premium superfoods without the premium price, because Dolce buys in bulk and passes the savings on
  - Their matcha moment: a café latte habit that costs a fortune, and the doubt about whether cheap matcha is real
  - Three products, one line each: Ceremonial Matcha, Ceremonial Reserve, Culinary Matcha
  - Trust: Certified Organic, grown in Nishio and Kagoshima, SQF-certified facility

**Email #1 v2: Welcome Offer (Cacao and baking)**
- Same as #1, with:
  - Email Topic: Welcome to Dolce! Here's 15% off your cacao
  - Their moment: baking and hot cocoa from real cacao, not sugary mixes
  - Products: Cacao Powder, Cacao Butter, Cacao Nibs

**Email #1 v3: Welcome Offer (Smoothie boosts)**
- Same as #1, with:
  - Email Topic: Welcome to Dolce! Here's 15% off your smoothie staples
  - Their moment: the morning smoothie they make every day with powders that cost too much at the store
  - Products: Blue Spirulina, Coconut Water Powder, Collagen Peptides

**SMS #1** (right after Email #1)
- Draft: Welcome to Dolce! Here's 15% off your first order: DOLCE15. [shop link] Reply STOP to opt out.

**Email #2: A note from Jeff**
- Send Time: 4 hours later
- Design: Plain text, from Jeff Weaver
- Offer: soft reminder of DOLCE15
- Goals:
  - Jeff left accounting for food. A CPA who did the math on superfood prices.
  - Six months in Madagascar learning vanilla from the farmers in Sava
  - Family-run with Megan, livable wages
  - The decision on purpose: buy in bulk, own the facility, keep the price fair without trading down
  - Invite a reply: "Tell me what you're making"

**Email #3: Customer reviews**
- Send Time: 1 day later
- Design: Yes
- Offer: reminder of DOLCE15
- Goals:
  - Real reviews from Klaviyo Reviews, in the customer's words
  - Answer the main doubt: "Why is it so cheap? Is something wrong with it?"
  - Second doubt: "Will a pound go stale before I finish it?"
  - Review count and where they live

**Email #4: Best sellers**
- Send Time: 1 day later
- Design: Yes
- Offer: reminder of DOLCE15
- Goals:
  - The six new customers start with: Ceremonial Matcha, Cacao Powder, Blue Spirulina, Ceylon Cinnamon, Cacao Butter, Cacao Nibs
  - One line on what each one is for
  - The easiest place to start: Ceremonial Matcha, the most reordered product (97 same-product repeats)
  - One row for coffee and mushroom shoppers (Instant Coffee, Lion's Mane)

**Email #5: Your offer just went up, for 24 hours**
- Send Time: 1 day later
- Design: Yes
- Sending to: subscribers who haven't purchased
- Offer: WELCOME20, 20% for 24 hours
- Goals:
  - The first direct ask to shop
  - A three-product starter basket for each pop-up answer
  - The bigger size as the smarter buy (cost per serving)

**SMS #2** (right after Email #5)
- Draft: 24 hours only: your Dolce code is now 20% off with WELCOME20. [shop link]

## Site Abandonment Flow (2 Emails)
- **Trigger:** active on site
- **Filter:** no product viewed, no add to cart, no checkout, no order, not in Browse or Cart
- **Re-entry:** after 7 days

**Email #1: Were you just checking us out?**
- Send Time: 2 hours later · Design: Yes · Offer: none (DOLCE15 if unused)
- Goals:
  - Why Dolce costs less: bulk buying and its own facility, same organic quality
  - Answer first-visit questions: is it really organic, how long does a pound last, how fast does it ship
  - One or two short reviews

**Email #2: Take a look at these best sellers**
- Send Time: 1 day later · Design: Yes · Offer: none
- Goals:
  - Ceremonial Matcha, Cacao Powder, Blue Spirulina, Cacao Butter
  - One line each on what it's for

## Browse Abandonment Flow (3 Emails + 1 SMS)
- **Trigger:** viewed product
- **Filter:** no add to cart, no checkout, no order, not in Cart
- **Re-entry:** after 7 days

**Email #1: Still thinking about this?**
- Send Time: 2 hours later · Design: Yes, dynamic viewed product · Offer: none
- Goals:
  - The product they viewed
  - Why it beats the alternatives: organic, where it's grown, the price per pound against store prices

**Email #2: Everyone is loving Dolce**
- Send Time: 1 day later · Design: Yes, dynamic · Offer: DOLCE15
- Goals:
  - Reviews for that product or its category
  - The code
  - Friction: free-shipping threshold [client to confirm], shipping time [client to confirm]

**SMS #1** (right after Email #2)
- Draft: Still thinking about {{ProductName}}? It's waiting for you: [link]

**Email #3: Sh… don't tell anyone about this**
- Send Time: 1 day later · Design: Yes, dynamic · Offer: DOLCE15, ends tonight
- Goals: the product is still there, and the code ends tonight

## Abandoned Cart Flow (4 Emails + 1 SMS)
- **Trigger:** started checkout
- **Filter:** placed order zero times since starting this flow
- **Re-entry:** after 1 day

**Email #1: I think you forgot this…**
- Send Time: 30 minutes later · Design: Yes · Offer: none
- Structure: headline, subheadline, button, dynamic cart, button

**SMS #1** (right after Email #1)
- Draft: You left something in your cart at Dolce. Finish checking out: [checkout link]

**Email #2: Here's what people are saying about Dolce**
- Send Time: 1 day later · Design: Yes · Offer: none
- Goals:
  - Dynamic cart
  - Reviews for what's in it
  - Attach item by recipe: matcha + Coconut Milk Powder (latte), cacao powder + Ceylon Cinnamon (hot cocoa), spirulina + Coconut Water Powder (smoothie)

**Email #3: Grab your mystery discount**
- Send Time: 1 day later · Design: Yes · Offer: MYSTERY, real value 20%
- Goals: excitement, the code, the reveal at checkout

**Email #4: Last chance for your mystery discount**
- Send Time: 1 day later · Design: Yes · Offer: MYSTERY ends at midnight
- Goals: the deadline, the dynamic cart, one checkout button

## Post-Purchase Flow (4 Emails)
- **Trigger:** placed order
- **Filter:** first order ever (placed order = 1 over all time)
- **Re-entry:** once only
- The existing "2nd-time purchasers" flow keeps running for repeat buyers.

**Email #1: Thank you, {{first_name}}**
- Send Time: 5 minutes later · Design: Plain text, from Jeff · Offer: none
- Goals:
  - Thank them for trusting a family business
  - When it ships and arrives [shipping times, client to confirm]
  - Reply here with any question

**Email #2: Three ways to use your {{ProductName}} this week**
- Send Time: 1 day later · Design: Yes · Offer: AGAIN10 below the recipes
- Goals:
  - Matcha: how much per cup, water temperature, whisking, the latte
  - Cacao: hot cocoa, brownies, a no-bake bar
  - Smoothie boosts: how much per blend, three recipes
  - How to store a pound so it stays fresh (answers "will it go stale")
  - Then the 10% second-order code, 14 days

**Email #3: How's the pound going?**
- Send Time: 7 days later · Design: Plain text, from Jeff · Offer: none
- Goals:
  - The question only Dolce can ask: "Has the matcha made it past the first week, or is it already half gone?"
  - Ask for the review in Klaviyo Reviews
  - Invite a reply if anything's off

**Email #4: Picked for you: what goes with your {{ProductName}}**
- Send Time: 2 days later · Design: Yes · Offer: AGAIN10 with its expiry
- Pairing map:
  - Ceremonial Matcha → Ceremonial Reserve (the upgrade) + Coconut Milk Powder
  - Cacao Powder → Cacao Butter + Cacao Nibs
  - Cacao Butter → Cacao Powder + Madagascar vanilla
  - Blue Spirulina → Coconut Water Powder + Pea Protein
  - Instant Coffee → Coconut Milk Powder + Lion's Mane
- The bigger size as the better standing deal (cost per serving)
- Free-shipping threshold as the basket builder [client to confirm]

_The order data shows almost every repeat path is the same product again, so these cross-sells are recipe-based pairings, not measured paths. The upgrade and the reorder lead._

## Replenishment Flow (2 Emails + 1 SMS), rebuild of the live flow
- **Why:** 72% of returning buyers reorder the same product, and the live flow already made $13,456 in 60 days.
- **Trigger:** placed order
- **Filter:** no order since starting this flow, not in Cart
- **Re-entry:** after 1 day

**Email #1: Running low on {{ProductName}}?**
- Send Time: 45 days later (before the 55-day median, after the p25 of 25 days)
- Design: Yes · Offer: none (someone genuinely low reorders at full price)
- Goals: one-tap reorder of what they bought, the bigger size, one attach item

**SMS #1** (right after Email #1)
- Draft: Running low on {{ProductName}}? Reorder in one tap: [reorder link]

**Email #2: Last call before you run out**
- Send Time: 6 days later · Design: Yes · Offer: RESTOCK15, 72 hours
- Goals: the code with its deadline, and the bigger size side by side as the smarter buy

## Winback Flow (2 Emails)
- **Trigger:** placed order
- **Filter:** first-time customers, no order since starting this flow
- **Re-entry:** once only

**Email #1: We miss you, {{first_name}}**
- Send Time: 90 days later (75% of second orders land by day 92)
- Design: Yes · Offer: COMEBACK20
- Goals:
  - What's new since they left
  - Reorder block with what they bought
  - The code
  - An easy reply if something went wrong

**Email #2: Your 20% ends soon**
- Send Time: 5 days later · Design: Yes · Offer: COMEBACK20 with its expiry
- Goals: the deadline, and the best sellers in their group

## Existing flows
- **Keep running, outside this strategy:** Matcha Wholesale ($10,679 in 60 days, $47.46 per recipient) and the other wholesale flows, Review Request, Back in Stock, Post-Purchase for 2nd-time buyers, Sunset.
- **After Black Friday:** switch the EARLY ACCESS versions off and the rebuilt Welcome, Browse, Cart and Post-Purchase on.
- **Consolidate:** two Site Abandonment flows are live (one on Triple Pixel). Keep one.

## Flow rules
- A purchase exits Welcome, Site, Browse and Cart.
- One retargeting flow at a time: Cart beats Browse, Browse beats Site.
- Smart Sending off on Welcome and the abandonment flows.
- Anyone who got a flow discount and didn't buy gets no other flow discount for 60 days.
- SMS only with SMS consent.
- No health or benefit claims, and never "FDA Approved".

## Needed from Dolce
- **Approve:** the offer ladder, Hannah as sender
- **Facts:** free-shipping threshold, shipping times
- **To check:** current pop-up submit rate
