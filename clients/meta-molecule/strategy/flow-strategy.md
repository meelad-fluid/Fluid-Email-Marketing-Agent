# Meta Molecule Email Flow Strategy

Status: draft · needs client approval · goes live once the automations are built in Customer.io

_Prepared 2026-11-19 · Onboarding mode (no store or email data yet: new Customer.io account) · Replenishable version · Platform: Customer.io · From: Claire from Meta Molecule (proposed)_

## Compliance (read first)

Meta Molecule sells research-use-only materials. Every flow, email, SMS, image and subject line below follows Fluid's RUO compliance rules, and those rules win over anything else in this doc.

- **Every email and SMS carries a visible research-use line.** Product emails carry it in the body next to the products, plus the footer: "FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION." (default wording until Meta Molecule approves its own).
- **No human-use language anywhere:** no bodies, outcomes, results, goals, protocols, dosing, reconstitution, administration, "cycles", "running low", or effect-based categories.
- **Products are named exactly as the catalog names them** (compound + size, e.g. "MOTS-C 40mg"). Categories by format only: Vials, Blends, Bundles.
- **The selling is done by documentation, lot traceability, same-day shipping, fair pricing and support.** Never by claims.
- **Only documented facts are stated.** Per-batch HPLC + MS testing, the ≥99% purity figure, the testing lab and "50,000+ research customers" are used only once the matching COAs and substantiation are published (see Open Items).
- **Imagery:** real vials and packaging, real COAs, lab equipment. Never people, syringes or before/after.
- **No attach offers for bacteriostatic water, syringes or other supplies framed around use.**
- **Every draft is checked against the compliance gate, and a person at Fluid approves it before it goes live.**

## Built From Your Brand

- **Who the customer is:** research buyers, in the three types Meta Molecule's own entry gate asks for: independent/private labs, academic/university labs, and contract research organizations (site gate). They buy online, compare vendors side by side, and have been let down before. Meta Molecule's own line: "an industry full of smoke and mirrors" (onboarding answers).
- **The problems this strategy is built around:** COAs that don't match the lot in hand or don't name a lab; vendors that resell, relabel or go quiet; orders stuck in "processing" mid-project; inconsistent lots between orders.
- **Why Meta Molecule is different:** "Research peptides with documentation you can inspect" (site hero): a public COA library, orders before 1 p.m. CT Mon–Fri ship the same day, free U.S. shipping at $200, and "high quality without price gouging" (onboarding answers).
- **Where new customers start (estimate, from the client's best-seller list; to confirm with order data):** Tesamorelin 10mg ($60), MOTS-C 40mg ($119), CJC 1295 No DAC 5mg / Ipamorelin 5mg Blend ($48). Reta and Tirz are also named best sellers but aren't in the public shop listing, so they appear through dynamic blocks (viewed product, cart, previous order) rather than in fixed product lists until we have their product pages.
- **The strategy's focus:** earn trust through documentation before asking for the order, make the same-day cutoff a reason to choose them, and move first-time buyers to the catalog's own bundles for the second order.
- **Voice:** professional, confident, science-driven and approachable (onboarding answers). Precise, short sentences, real numbers, a person who answers email.

## Opt-in

Shown after the researcher verification gate (21+, researcher type, terms).

### Step #1: Teaser + Collect Zero Party Data
**Headline:** Want 10% off your first research order?
**Question:** What are you ordering for?
- **Option #1:** Single-compound vials
- **Option #2:** Blends & bundles
- **Option #3:** Lab or bulk supply

- Options follow the shop's own filters (Vials, Blends, Bundles) plus wholesale, never an effect
- Stored as `popup_interest` on the Customer.io profile and reused in campaigns
- Creative: real vials on a clean lab bench beside a printed COA with the lot number visible

### Step #2: Collect Email
**Headline:** Where should we send it?
**Sub:** 10% off your first order, plus a heads-up when new lots land and their COAs are published.
**Button:** Continue

### Step #3: Collect SMS
**Headline:** Want shipping and new-lot alerts by text?
**Sub:** A few texts a month: same-day shipping cutoffs and new COAs. For research use only.
**Button:** Yes, text me
**Secondary:** No thanks, email is fine
**Consent:** By submitting you agree to receive recurring automated marketing texts. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to cancel.

### Step #4: Confirmation
**Headline:** You're in.
**Sub:** Your code is WELCOME10 for 10% off your first order. It's in your inbox now. Products are for research use only, not for human or veterinary use or consumption.
**Button:** Explore Research Catalog

## Offers

All values proposed for client approval (the brand's ceiling is 25%). Codes can't be combined with each other or with the site's Buy 2 Get 1 promotion.

| Where | Code | Value | Conditions |
|---|---|---|---|
| Pop-up, Welcome #1–#4, Welcome SMS #1 | WELCOME10 | 10% off | First order, single use |
| Welcome #5, Welcome SMS #2 | WELCOME15 | 15% off | First order, expires 24 hours after Email #5 |
| Browse Abandonment #2–#3 | BROWSE10 | 10% off | Single use, expires end of day of Email #3 |
| Abandoned Checkout #3–#4 | MYSTERY | Teaser "up to 25% off", real 15% | Single use, expires midnight after Email #4 |
| Post-Purchase #2 and #4 | SECOND15 | 15% off second order | Expires 7 days after Email #4 |
| Winback #1–#2 | COMEBACK20 | 20% off | Expires 5 days after Email #2 |

## Welcome Flow (7 Emails + 2 SMS)

**Flow note:** Trigger: pop-up submission (profile joins the "Pop-up subscribers" segment). Flow filter: exits on `placed_order`. Re-entry: never. Branch on `popup_interest`: Option #1 → Email #1, Option #2 → Email #1 v2, Option #3 → Email #1 v3; Emails #2–#5 and both SMS are shared. SMS steps only for profiles with SMS consent.

### Email #1: Welcome Offer (Option #1 – Single-compound vials)

- **Send Time:** Immediately after sign up
- **Email Topic:** Welcome to Meta Molecule: here's your 10%, and the COA for every vial you're looking at
- **Design:** Yes
- **Sending to:** New subscribers who chose "Single-compound vials"

**Goals:**

- Welcome them and introduce Claire from the Meta Molecule team
- Give them their offer
  - **Code:** WELCOME10
  - **Value:** 10% off first order
- The mission in the brand's words: quality and service for researchers "in an industry full of smoke and mirrors"
- Speak to the independent lab buyer comparing vendor tabs where none of the COAs show a lot number
  - That's the moment the brand exists for: check the documentation before you pay
- Three vials, one line each (compound, size, price) and a "View COA" link
  - Tesamorelin 10mg ($60), MOTS-C 40mg ($119), GHK-Cu Copper 100mg ($40)
  - Estimate from the client's best-seller list; swap for the top first-order vials once order data is in
- Same-day line: orders before 1 p.m. CT, Monday to Friday, ship the same day; free U.S. shipping at $200
- Research-use line in the body next to the products
- CTA: Explore Research Catalog

**Conditional Split:** If they subscribed to SMS

### SMS #1

- **Send Time:** Immediately after Email #1
- **Goals:** Welcome and the code; link to the COA library so the first click is documentation
- "Welcome to Meta Molecule. Your 10% code: WELCOME10. Check any lot's COA before you order: [COA library link] For research use only. Reply STOP to opt out."

### Email #1 v2: Welcome Offer (Option #2 – Blends & bundles)

- **Send Time:** Immediately after sign up
- **Email Topic:** Welcome to Meta Molecule: here's your 10%, and how our bundles price out
- **Design:** Yes
- **Sending to:** New subscribers who chose "Blends & bundles"

**Goals:**

- Same welcome, mission and code as Email #1
  - **Code:** WELCOME10
  - **Value:** 10% off first order
- Speak to the buyer who splits orders across vendors to save on shipping
- Three products with list price vs bundle price shown side by side
  - CJC 1295 No DAC 5mg / Ipamorelin 5mg Blend ($48)
  - BPC157/TB500 Blend 5mg/5mg ($48)
  - CJC-1295 / IPA + Tesa Bundle ($100.44, list $108)
- Free U.S. shipping at $200 after discounts as the reason a bundle makes sense
- Each product links to its COA and specifications
- Research-use line next to the products; CTA: Explore Research Catalog

### Email #1 v3: Welcome Offer (Option #3 – Lab or bulk supply)

- **Send Time:** Immediately after sign up
- **Email Topic:** Welcome to Meta Molecule: ordering for a lab? Here's how we work
- **Design:** Yes
- **Sending to:** New subscribers who chose "Lab or bulk supply"

**Goals:**

- Same welcome, mission and code as Email #1
  - **Code:** WELCOME10
  - **Value:** 10% off first order
- Speak to the CRO or lab buyer whose project can't absorb a backorder or a lot change
- The two larger formats: The Library Bundle ($480, list $522) and MOTS-C + SS-31 Bundle ($221.34, list $238)
- The wholesale inquiry form as the second CTA, with the reply time [wholesale reply time — client to supply]
- Same-day shipping cutoff and U.S. fulfilment
- Research-use line next to the products; primary CTA: Explore Research Catalog; secondary: Contact Support

### Email #2: Personal Note from the Founder

- **Send Time:** 4hrs later
- **Email Topic:** Why I started Meta Molecule
- **Design:** Plain text. No images, no buttons, one inline text link
- **Sending to:** New subscribers

**Goals:**

- From the founder by name [founder name and story — client to supply]
- Why the brand exists: researchers were getting poor documentation, poor service and inflated prices
- The decisions made on purpose: publish the documentation, ship same day, don't price-gouge
- Invite a reply: "If a COA doesn't make sense or you can't find one, reply and I'll get you an answer"
- Soft reminder that WELCOME10 is still active
- Research-use line in the signature

### Email #3: Customer Reviews

- **Send Time:** 1 day later
- **Email Topic:** Four things to check on any COA (including ours)
- **Design:** Yes
- **Sending to:** New subscribers

**Goals:**

- Proof here is verification, not reviews: there are no published reviews, and results-style reviews are never used
- A four-point checklist, with a real Meta Molecule COA annotated beside it
  - The lot number on the COA matches the label on the vial
  - The testing lab is named
  - The method is stated (HPLC for purity, MS for identity), only as shown on the published COA
  - The report is dated
- Speak to the buyer zooming into a blurry vendor COA screenshot with no lab name on it
- Where the COA library lives and how to find a product's report
- If service reviews (shipping, support, packaging) are collected later, add 2–3 here
- Reminder of WELCOME10; CTA: View COA Library

### Email #4: Best Seller Showcase

- **Send Time:** 1 day later
- **Email Topic:** Where most researchers start with Meta Molecule
- **Design:** Yes
- **Sending to:** New subscribers who have not purchased

**Goals:**

- The three products new customers start with, by compound, size and price, each with its COA link
  - Tesamorelin 10mg ($60)
  - MOTS-C 40mg ($119)
  - CJC 1295 No DAC 5mg / Ipamorelin 5mg Blend ($48)
  - Estimate from the client's best-seller list; replace with the top first-order products once order data exists
- One identity line per product (format, size, what's on its COA), no descriptions of effects
- The easiest place to start: a single vial, documented, shipped today if ordered before 1 p.m. CT
- Reminder of WELCOME10; research-use line next to the products

### Email #5: Upgrade offer for only 24 hours

- **Send Time:** 1 day later
- **Email Topic:** Your code just went to 15%, for the next 24 hours
- **Design:** Yes
- **Sending to:** New subscribers who have not purchased

**Goals:**

- Lead with the numbers: 10% is now 15%, for 24 hours
  - **Code:** WELCOME15
  - **Value:** 15% off first order, expires 24 hours after send
- The first direct ask to order
- Second reason: order before 1 p.m. CT and it ships today
- Free U.S. shipping at $200 after discounts as the basket builder
- The three Email #4 products again, compact
- Research-use line next to the products

### SMS #2

- **Send Time:** Immediately after Email #5
- **Goals:** The upgraded code and the deadline
- "24 hours only: your Meta Molecule code is now 15% off with WELCOME15. [catalog link] For research use only. Reply STOP to opt out."

## Site Abandonment Flow (2 Emails)

**Flow note:** Trigger: page view on the site with no product view, add to cart or checkout. Flow filter: exits on `product_viewed`, `checkout_started` or `placed_order`; not in the Browse Abandonment or Abandoned Checkout flow. Re-entry: after 7 days. No new discount.

### Email #1: Find your way

- **Send Time:** 2hrs later
- **Email Topic:** Were you comparing suppliers?
- **Design:** Yes
- **Sending to:** Site visitors who left without viewing a product

**Goals:**

- Speak to the buyer with three vendor tabs open
- What makes Meta Molecule the brand: documentation you can inspect before you order
- Three proof points: the COA library, same-day shipping before 1 p.m. CT, free U.S. shipping at $200
- Mention WELCOME10 only if they hold it and haven't used it
- CTA: View COA Library; secondary "reply with any question"

### Email #2: Best sellers

- **Send Time:** 1 day later
- **Email Topic:** What researchers order first
- **Design:** Yes
- **Sending to:** Site visitors who left without viewing a product

**Goals:**

- The same three starting products as Welcome #4, each with compound, size, price and COA link
- One line per product on format and documentation, no effects
- Research-use line next to the products; CTA: Explore Research Catalog

## Browse Abandonment Flow (3 Emails + 1 SMS)

**Flow note:** Trigger: `product_viewed`. Flow filter: exits on `added_to_cart`, `checkout_started` or `placed_order`; not in the Abandoned Checkout flow. Re-entry: after 7 days. Dynamic block: the viewed product (image, name, size, price, link to its COA); if the event has no product data, show the three starting products.

### Email #1: Reminder

- **Send Time:** 2hrs later
- **Email Topic:** Still comparing [viewed product]?
- **Design:** Yes
- **Sending to:** Window shoppers

**Goals:**

- Dynamic block with the viewed product and a "View COA" link
- Speak to the moment they're comparing that compound across vendors
- Why buy it here: the lot's documentation is public, it ships today before 1 p.m. CT, priced without the markup
- Invite questions: reply and a person answers
- No offer; research-use line next to the product

### Email #2: Reminder + Social Proof + Incentive

- **Send Time:** 1 day later
- **Email Topic:** Check the COA before you decide
- **Design:** Yes
- **Sending to:** Window shoppers

**Goals:**

- The viewed product again, with how to verify its lot: find the lot number, open its report, check the lab and date
- The browse incentive
  - **Code:** BROWSE10
  - **Value:** 10% off, expires end of day of Email #3
- Reduce friction: free U.S. shipping at $200; damaged or incorrect items handled by support (no returns once shipped, so say it plainly)
- If the viewed product is part of a catalog bundle, show the bundle price beside it
- Research-use line next to the product

### SMS #1

- **Send Time:** Immediately after Email #2
- **Goals:** Simple reminder pointing to the product's documentation
- "Still looking at [viewed product]? Its COA and specs are here: [product link] For research use only. Reply STOP to opt out."

### Email #3: Reminder + Incentive Expiry

- **Send Time:** 1 day later
- **Email Topic:** Your 10% code expires tonight
- **Design:** Yes
- **Sending to:** Window shoppers

**Goals:**

- The viewed product is still there, with its COA link
- BROWSE10 expires tonight
- Order before 1 p.m. CT and it ships today
- One CTA to the product; research-use line next to it

## Abandoned Checkout Flow (4 Emails + 2 SMS)

**Flow note:** Trigger: `checkout_started`. Flow filter: exits on `placed_order`. Re-entry: after 1 day. Dynamic cart table: product image, name, size, quantity, price, plus a COA link per line; button returns to the saved checkout URL.

### Email #1: Simple Reminder

- **Send Time:** 30 minutes later
- **Email Topic:** You left this in your cart
- **Design:** Yes. Headline → sub headline → button → cart table → button
- **Sending to:** People who abandoned checkout

**Goals:**

- Simple reminder, no discount
- Cart table
- One line on timing: order before 1 p.m. CT and it ships today
- Research-use line under the table

### SMS #1

- **Send Time:** Immediately after Email #1
- **Goals:** Simple reminder about the cart
- "Your Meta Molecule cart is saved. Finish checking out: [checkout link] For research use only. Reply STOP to opt out."

### Email #2: Reminder + Social Proof

- **Send Time:** 1 day later
- **Email Topic:** Every item in your cart has a COA
- **Design:** Yes
- **Sending to:** People who abandoned checkout

**Goals:**

- Proof is documentation: the cart table with a "View COA" link on every line
- Speak to the doubt they had at checkout: "is this lot really what the paperwork says?"
- Attach item: the catalog bundle that includes something in the cart (e.g. CJC 1295 No DAC / Ipamorelin in the cart → CJC-1295 / IPA + Tesa Bundle), or the item that gets the cart over $200 for free shipping
  - Never bacteriostatic water, syringes or other supplies
- Research-use line under the table

### Email #3: Mystery Discount

- **Send Time:** 1 day later
- **Email Topic:** Your mystery discount is inside
- **Design:** Yes
- **Sending to:** People who abandoned checkout

**Goals:**

- Excitement and urgency: "Get up to 25% off your order"; the code reveals the real value at checkout
  - **Code:** MYSTERY
  - **Value:** Teaser up to 25%, real 15% off; single use
- Cart table and one checkout button
- State it can't be combined with other codes or the site's Buy 2 Get 1 promotion
- Research-use line under the table

### SMS #2

- **Send Time:** Immediately after Email #3
- **Goals:** Point them to the mystery code
- "Your Meta Molecule mystery discount is in your inbox. Code MYSTERY, expires tomorrow at midnight: [checkout link] For research use only. Reply STOP to opt out."

### Email #4: Mystery Discount (last chance)

- **Send Time:** 1 day later
- **Email Topic:** Last chance: your mystery code expires at midnight
- **Design:** Yes
- **Sending to:** People who abandoned checkout

**Goals:**

- MYSTERY expires at midnight
- Cart table
- One checkout button
- Research-use line under the table

## Post-Purchase Flow (4 Emails + 1 SMS)

**Flow note:** Trigger: `placed_order` where it's the customer's first order. Re-entry: never. Doesn't replace WooCommerce's order confirmation or shipping emails.

### Email #1: Thank You + Order Confirmation

- **Send Time:** 5 minutes later
- **Email Topic:** Thank you, [first name]
- **Design:** Plain text. From the founder, no images, no buttons
- **Sending to:** New customers

**Goals:**

- Thank them for trusting a new supplier [founder name — client to supply]
- Shipping expectations so nobody has to email support: before 1 p.m. CT Mon–Fri ships today, otherwise next business day; tracking arrives by email
- Returns, said kindly and plainly: no returns once shipped, so check the box on arrival and email support@metamolecule.com right away if anything is damaged or incorrect
- Offer support by reply
- No offer yet; research-use line in the signature

### SMS #1

- **Send Time:** Immediately after Email #1
- **Goals:** Shipping expectation and a support line
- "Thanks for your Meta Molecule order. Orders before 1 p.m. CT ship today; tracking follows by email. Questions? Reply here. For research use only. Reply STOP to opt out."

### Email #2: Your lot's documentation (+ second-purchase offer)

- **Send Time:** 1 day later
- **Email Topic:** How to match your vial to its COA
- **Design:** Yes
- **Sending to:** New customers

**Goals:**

- Documentation orientation, never use instructions
  - Find the lot number on the label
  - Open that lot's report in the COA library (dynamic link per product ordered where possible)
  - What each section of the COA shows, in plain language (only sections the published COA actually has)
- Storage and handling of the material as supplied, only as printed on the label or COA [storage specs — client to confirm]
- Who to contact if anything doesn't match
- Below the documentation: the second-order code
  - **Code:** SECOND15
  - **Value:** 15% off second order
- Research-use line in the body

### Email #3: Plain text email from the founder

- **Send Time:** 7 days later
- **Email Topic:** Did the COA check out?
- **Design:** Plain text. One inline review link
- **Sending to:** New customers

**Goals:**

- The question only this brand can ask: did the documentation match what arrived?
- Ask for a review of what they can verify: documentation, packaging, shipping speed, support [review platform — client to choose]
- Say plainly that Meta Molecule can't publish anything about personal use
- Invite a reply so problems get caught early
- No discount, no product grid

### Email #4: Upsell Offer

- **Send Time:** 2 days later
- **Email Topic:** Researchers who ordered [product] also ordered…
- **Design:** Yes
- **Sending to:** New customers

**Goals:**

- Pairing map built from the catalog's own bundles (to confirm with order data)
  - Bought Tesamorelin 10mg: CJC-1295 / IPA + Tesa Bundle, Tesa + SLU-PP-332 Bundle
  - Bought MOTS-C 40mg: MOTS-C + SS-31 Bundle
  - Bought CJC 1295 No DAC / Ipamorelin Blend: CJC-1295 / IPA + Tesa Bundle
  - Bought BPC157/TB500 Blend: BPC-157 + TB-500 Bundle
  - Bought Semax or Selank: Semax + Selank Bundle, Dihexa + Semax + Selank Bundle
  - Anything else: the three starting products
- The second-order code with a clear expiry
  - **Code:** SECOND15
  - **Value:** 15% off, expires 7 days after this email
- Free U.S. shipping at $200 as the basket builder
- Research-use line next to the products

## Winback Flow (2 Emails + 1 SMS)

**Flow note:** Trigger: `placed_order` where it's the customer's first order. Flow filter: exits on any later `placed_order`. Re-entry: never. Delay of 90 days is an estimate; set it from the time between orders once order data is in.

### Email #1: We miss you

- **Send Time:** 90 days after their first and only order
- **Email Topic:** Since your last order: new lots and published COAs
- **Design:** Yes
- **Sending to:** First-time customers who haven't ordered again

**Goals:**

- Neutral news hook: what's changed since they ordered (new lots, new COAs in the library, products added)
  - Never imply they've run out or need more for use
- Reorder block with what they bought before (dynamic, previous order) and its current lot's COA link
- The winback code
  - **Code:** COMEBACK20
  - **Value:** 20% off
- An easy way to tell us if something went wrong with the first order
- Research-use line next to the products

### SMS #1

- **Send Time:** Immediately after Email #1
- **Goals:** The news hook and the code
- "New lots are in at Meta Molecule and their COAs are published. 20% off with COMEBACK20: [catalog link] For research use only. Reply STOP to opt out."

### Email #2: Come back offer

- **Send Time:** 5 days later
- **Email Topic:** Your 20% code expires soon
- **Design:** Yes
- **Sending to:** First-time customers who haven't ordered again

**Goals:**

- Same code with a clear expiry
  - **Code:** COMEBACK20
  - **Value:** 20% off, expires 5 days after this email
- The catalog's bundles as the better standing deal
- One primary CTA: Explore Research Catalog
- Research-use line next to the products

## Flow Rules

- A purchase exits Welcome, Site Abandonment, Browse Abandonment and Abandoned Checkout
- One retargeting flow at a time: Checkout beats Browse, Browse beats Site Abandonment
- SMS only to contacts with SMS consent; every SMS ends with the research-use line and STOP
- Non-converters from the discount flows get no further flow discounts for 60 days
- Every email passes the RUO compliance gate and is approved by a person at Fluid before its automation goes live
- Replenishment flow not proposed: "running low" timing implies use
- **Customer.io build:** each flow is an automation; conversion goal is `placed_order` within 5 days of the email; HTML comes from each approved design. Events needed from WooCommerce: `placed_order` (with order count, line items, lot if available), `product_viewed`, `added_to_cart`, `checkout_started` (with checkout URL), page views

## Open Items for the Client

- Founder name and story (Welcome #2, Post-Purchase #1 and #3)
- Approve the offer ladder and codes (WELCOME10, WELCOME15, BROWSE10, MYSTERY, SECOND15, COMEBACK20)
- Approve the research-use disclaimer wording and an SMS disclosure
- Approve the sender persona "Claire from Meta Molecule" and the reply-to inbox
- Publish per-product, lot-matched COAs (the library shows one today); confirm the testing lab and methods
- Storage specs as supplied (Post-Purchase #2)
- Wholesale reply time (Welcome #1 v3)
- Review platform for service reviews (Post-Purchase #3)
- Product pages for Reta and Tirz, if they should appear in fixed product lists
- Full business street address for the email footer
- WooCommerce → Customer.io integration and the events listed above
- Pop-up tool (Customer.io in-app form or a third-party form passing `popup_interest`)
- Order data (last 90 days) to replace the estimated starting products, pairing map and 90-day winback timing
