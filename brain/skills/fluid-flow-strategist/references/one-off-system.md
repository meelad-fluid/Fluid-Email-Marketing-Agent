# Fluid's flow system — one-off brands

**Who it's for:** apparel and fashion, jewelry, home and decor, gear and equipment, accessories, digital products, and anything else customers buy once and don't use up.

**How these customers buy:** the product lasts, so there's no reorder clock. Purchases are considered, often expensive, and the doubts are about trust: will it fit, will it look like the photos, is it worth the price, will I buy the wrong thing. A second order comes from a *different* product: the bracelet that goes with the chain, the second look for the same trip, the add-ons for the kayak, the next size up when the kid outgrows the bike. So the system's job is to get the first order past the trust doubts, make the customer glad they bought (fit, care, styling, setup), collect the review and photo that answer the next shopper's doubts, and cross-sell into a complementary core product.

This file is distilled from Fluid's 15 one-off strategies (Gold Urban, Angel Brinks, Sanhouse Fit, LGNDRY Fit, Ellaé Lisqué, Daily Belts, Layered Blankets, Makuzo Home, FencePot, Liquid Surf and Sail, Orion Moto, Drone Doctor, Decals.com, Ovani Sound, Exotic Ammo). **The skeleton is identical to the replenishable system**: same pop-up, same six core flows, same email order, same timings. What changes is what goes inside the emails, the offers, and the winback window. **Don't add, drop or merge emails.** Departures go in the plan as recommendations (SKILL.md, Step 4).

Items marked **DATA** are slots that the client's Hiro data fills (see `hiro-flow-data.md`). Items marked **BRAND** come from the client's website, brief or onboarding call; if you can't find them, leave a labeled placeholder.

## Contents

- [Opt-in pop-up](#opt-in-pop-up)
- [Welcome flow](#welcome-flow-7-emails--2-sms)
- [Site abandonment](#site-abandonment-flow-2-emails)
- [Browse abandonment](#browse-abandonment-flow-3-emails--1-sms)
- [Abandoned checkout](#abandoned-checkout-flow-4-emails--1-sms)
- [Post-purchase](#post-purchase-flow-4-emails)
- [Winback](#winback-flow-2-emails)
- [Offer ladder](#offer-ladder)
- [Flow rules](#flow-rules)

## Opt-in pop-up

The capture device that turns site traffic into list subscribers. The whole point is the **highest submit rate possible**; Fluid's target is 10%+.

**Step #1: Teaser + Collect Zero Party Data**
- **Headline:** the client's offer (**BRAND**). Most docs use "Want [X]% off?", but one-off brands vary more than replenishable ones:
  - Percent off: 5%–20% (Gold Urban 20%, Sanhouse 15%, Angel Brinks 10%, Liquid Surf 5%).
  - Dollar off for high-ticket: Orion Moto "$25 off your first order", positioned as a welcome gift.
  - Tiered or bundle savings: Daily Belts "Unlock up to 30% off" (auto-applied bundle pricing).
  - No discount, for expert-led or service brands: Drone Doctor "Want expert drone guidance?" (a free recommendation).
- **Question + 3 options.** The answer decides which version of Welcome Email #1 they get. Question styles that have worked:
  - Category: "What are you shopping for?" Classic Gold Chains / Gold Rings / Everyday Bracelets
  - Who it's for: "Who are you shopping for?" (LGNDRY Fit)
  - Style: "What's your style preference?" Classic & Timeless / Warm & Versatile / Modern & Bold (Daily Belts)
  - Occasion: "What occasion are you shopping for?" Birthday or celebration / Wedding or formal event / Vacation or getaway (Ellaé Lisqué)
  - Fit or compatibility: "What type of fence do you have?" (FencePot)
  - Customer type: "What type of customer are you?" Individual / Business Owner / Event Planner (Decals.com)
  - Intent: "What are you looking for help with today?" Buy A Drone / Repair My Drone / Upgrade My Fleet (Drone Doctor)
- **DATA:** the options come from the categories new customers actually start with. Style, occasion and intent questions still have to map each option to real products.

**Steps #2–#4:** Collect Email, Collect SMS (optional, its own step, with the consent line), Confirmation (the code and one button to shop).

## Welcome Flow (7 Emails + 2 SMS)

The 7 emails are Email #1's three versions plus Emails #2–#5; each subscriber receives 5.

**Flow note:** Trigger: added to the pop-up list. Flow filter: placed order 0 times since starting the flow. Split: conditional split on the pop-up answer.

**Purpose:** engage new subscribers, educate them on the brand, position it as the leader in its space, get past the trust doubts, get the first purchase, and keep reminding them of the welcome offer.

### Email #1: Welcome Offer (Option #1 – [answer]) · v2 (Option #2) · v3 (Option #3)
- **Send Time:** Immediately after sign up · **Design:** Yes · **Sending to:** New subscribers who selected Option #N
- **Email Topic** built on their answer ("Find your signature ring", "Welcome to Liquid Surf and Sail: let's find your kayak or SUP setup").
- **Goals**, in this order:
  - Welcome to the brand
  - Give them their offer, with **Code** and **Value**, plus any ongoing offer and the "codes can't be combined" line (Gold Urban: Buy Any 2, Get the 3rd Free)
  - Go over the brand mission (**BRAND**)
  - Highlight the category they chose: why it's worth it, and the trust basics for it (fit and sizing for apparel; materials, warranty and care for jewelry; dimensions and delivery for home; compatibility and expert help for gear)
  - Highlight their best-selling products: 3 for this option (**DATA**)
  - Optional: the AOV angle (build a rotation, layer pieces, complete the set), an expert-help CTA for high-ticket categories

**Conditional Split:** If they subscribed to SMS
### SMS #1
- **Send Time:** Immediately after Email #1 · **Goals:** welcome + the code (+ "reply if you need help choosing" for expert-led brands).

### Email #2: Personal Note from the Founder
- **Send Time:** 4 hours later · **Design:** Plain text
- **Goals:** the founder's story (**BRAND**), why they do things differently, what they won't compromise on (quality, honest advice, never putting a sale ahead of the right fit), an invitation to reply.

### Email #3: Customer Reviews
- **Send Time:** 1 day later · **Design:** Yes
- **Goals:** reviews and customer photos that answer the trust doubts for this category ("looks better than the photos", "fit true to size", "they helped me pick the right board"); review count and where it lives (**BRAND**); remind them of the code without making it the reason to buy.

### Email #4: Best Seller Showcase
- **Send Time:** 1 day later · **Design:** Yes
- **Goals:** the best-performing products or categories (**DATA**), presented as a guided tour of the shop rather than a product dump, each with who it's for. For high-ticket catalogs include an entry-price product so the first purchase doesn't have to be the biggest.

### Email #5: Upgrade offer for only 24 hours
- **Send Time:** 1 day later · **Design:** Yes · **Sending to:** New subscribers who have not purchased
- **Goals:** upgrade the offer for 24 hours (see the offer ladder); state exclusions (high-ticket items, MAP-restricted brands, custom quotes) where they apply; offer expert help before ordering for considered purchases.

### SMS #2
- **Send Time:** Immediately after Email #5 · **Goals:** the upgraded code and the 24-hour deadline.

## Site Abandonment Flow (2 Emails)

**Flow note:** Trigger: active on site, no product viewed, no add to cart, no order. Exclude anyone in the Browse or Checkout flows.

**Purpose:** bring them back and remind them the brand exists. No new discount.

### Email #1
- **Send Time:** 2 hours later · **Email Topic:** "Were you just checking us out?" · **Design:** Yes
- **Goals:** lead with helpfulness, not pressure: what the brand is, why people trust it, the hook (**BRAND**); a soft CTA ("Find your setup", "Explore the collection") or "reply for help".

### Email #2
- **Send Time:** 1 day later · **Email Topic:** "Take a look at these best sellers" · **Design:** Yes
- **Goals:** best-selling products or categories (**DATA**) with one practical line each.

## Browse Abandonment Flow (3 Emails + 1 SMS)

**Flow note:** Trigger: viewed a product, no add to cart, no order. Exclude anyone in the Checkout flow.

**Purpose:** window shoppers are comparing. Position the brand as the safer, better choice.

### Email #1: Reminder
- **Send Time:** 2 hours later · **Email Topic:** "Still thinking about it?" · **Design:** Yes
- **Goals:** dynamic block with the viewed product; acknowledge it's a considered purchase; answer the doubt for that category (fit, sizing, compatibility, quality); invite questions.

### SMS #1
- **Send Time:** Immediately after Email #2 · **Goals:** simple reminder of what they viewed.

### Email #2: Reminder + Social Proof + Incentive
- **Send Time:** 1 day later · **Email Topic:** "Everyone is loving [Brand]" · **Design:** Yes
- **Goals:** reviews and customer photos for the viewed category; a light incentive (code + value), kept small on high-ticket items; a contact-us CTA for considered purchases.

### Email #3: Reminder + Incentive Expiry
- **Send Time:** 1 day later · **Email Topic:** "Sh… Don't tell anyone about this" · **Design:** Yes
- **Goals:** the viewed product is still waiting, the code expires soon; "buy right the first time".

## Abandoned Checkout Flow (4 Emails + 1 SMS)

**Flow note:** Trigger: started checkout, no order. Re-entry on.

### Email #1: Simple Reminder
- **Send Time:** 30 minutes later · **Email Topic:** "I think you forgot this…" · **Design:** Yes
- **Goals:** simple reminder, no discount; dynamic table. **Email structure:** Headline → Sub headline → Button → Dynamic Table → Button

### SMS #1
- **Send Time:** Immediately after Email #1 · **Goals:** simple cart reminder.

### Email #2: Reminder + Social Proof
- **Send Time:** 1 day later · **Design:** Yes
- **Goals:** dynamic table; reviews about quality, fit and service; expert help before they complete the order; the natural pairing for what's in the cart (**DATA**: bought together).

### Email #3: Mystery Discount
- **Send Time:** 1 day later · **Email Topic:** "Grab your MYSTERY Discount" · **Design:** Yes
- **Goals:** excitement and urgency; a teaser bigger than the real value (see the offer ladder); exclusions stated where they apply.

### Email #4: Mystery Discount
- **Send Time:** 1 day later · **Email Topic:** "Last chance for your mystery discount" · **Design:** Yes
- **Goals:** the code expires at midnight; dynamic table; one checkout button.

## Post-Purchase Flow (4 Emails)

**Flow note:** Trigger: placed order. Don't duplicate the store's transactional confirmation.

**Purpose:** make them glad they bought, get the review and photo, and cross-sell into the next core product.

### Email #1: Thank You + Order Confirmation
- **Send Time:** 5 minutes later · **Design:** Plain text · **Sending to:** New customers
- **Goals:** from the founder; thank them for trusting the brand; set expectations for shipping and what comes next; offer help with sizing, setup, care or styling. **No second-purchase offer yet**: this one is about reassurance and a good first impression (Gold Urban says so explicitly).

### Email #2: How to get the most out of it (+ second-purchase offer)
- **Send Time:** 1 day later · **Design:** Yes · **Sending to:** New customers
- **Goals:** the ownership guide **for what they bought** — written per product type, as the reference docs do:
  - Apparel: styling ideas by piece, how to try it on, care, exchanges if the fit's off (Angel Brinks: styling for dresses vs catsuits vs gowns vs sets).
  - Jewelry: care that keeps it looking new, sizing, warranty, how to layer and pair.
  - Home: installation or placement, care, dimensions in the room (FencePot installation guide, Makuzo candle care).
  - Gear: setup, safety, storage, transport, maintenance before first use (Liquid Surf: "Before you hit the water, read this").
  - Digital: how to drop it into their project (Ovani Sound).
- Then, held below the guide: the second-purchase code and complementary recommendations from the pairing map (**DATA**). Some brands go straight to the cross-sell here (Sanhouse: "Complete your look with gym accessories").

### Email #3: Plain text email from the founder
- **Send Time:** 7 days later · **Design:** Plain text
- **Goals:** the check-in only this brand can ask ("How did it go?" after an occasion; "I can't wait for you to wear it"; "How is everything flying?"); invite replies so problems get caught early; ask for a review **with a photo**; warranty or upgrade reminders where the brand has them.

### Email #4: Upsell Offer
- **Send Time:** 2 days later · **Design:** Yes
- **Goals:** cross-sell into a complementary core product, written as pairing modules (**DATA**): Gold Urban's "Chain + Bracelet, Statement Chain + Everyday Chain, Byzantine Chain + Byzantine Bracelet"; Liquid Surf's add-ons per category (kayaks → paddles, PFDs, roof racks, carts). Plus "need another color?" for single-style hits (Daily Belts). The second-purchase code with a clear expiry; any ongoing bundle offer as the alternative.

## Winback Flow (2 Emails)

### Email #1: We miss you
- **Send Time:** after the brand's customer lifecycle (**DATA**: see `hiro-flow-data.md`). The reference docs ran 60–180 days, 90 most often, and split by segment when segments behave differently:
  - Liquid Surf: 45–60 days for repeat consumable-parts buyers, 120 for most retail, 180 for high-ticket and commercial.
  - Drone Doctor: 90 days for consumers, 180 for enterprise and fleet.
  - Orion Moto: 6–12 months, framed as "Ready for the next size up?" because kids outgrow the bike.
  - Gold Urban: 60 days, a "style refresh" window.
- **Design:** Yes (Liquid Surf used plain text for a check-in tone) · **Sending to:** First-time customers who have never purchased again
- **Goals:** new arrivals and refreshed best sellers; recommendations based on what they bought before (dynamic); the reason they chose the brand; coming back should feel like a style refresh or an upgrade, never a clearance event; the winback code (most docs put it in this email).

### Email #2: Come back offer
- **Send Time:** 3–14 days after Email #1 · **Design:** Yes
- **Goals:** the same code with a clear expiry; one primary CTA to their recommended collection; exclusions stated.

## Offer ladder

What the reference docs did, anchored on the client's welcome offer (W):

| Where | Default | Seen in the docs |
|---|---|---|
| Pop-up, Welcome #1–#4, SMS #1 | W | 5%–20%; $25 off (Orion); free expert recommendation (Drone Doctor) |
| Welcome #5 + SMS #2 | W + 5 points, 24 hours (dollar offers double) | 10→15, 15→20, 20→25, 5→10; $25→$50 |
| Site Abandonment | none | |
| Browse #2–#3 | about W, smaller on high-ticket | ANGEL10, GEAR5 |
| Checkout #3–#4 | a teaser above the real value | "up to 30%" → 15%; "up to 40%" → 20%; Gold Urban 25%; $100 undisclosed (Orion); "up to 10%" on eligible gear (Liquid Surf) |
| Post-Purchase #2 and #4 | second-purchase code, 10–25% | SECOND15, NEXTLOOK20, VIP20, SECOND25; $25 off gear |
| Winback #1–#2 | 10–25%, or $50 | COMEBACK25, WINBACK15, COMEBACK50 |

Rules that come up again and again in these docs:
- **High-ticket brands discount less, or in dollars.** Liquid Surf held at 5–10% with exclusions for MAP-restricted brands, high-ticket items, custom quotes and commercial packages. Orion used dollar amounts. Drone Doctor replaced discounts with priority expert help.
- **Ongoing offers sit beside the codes, never stacked.** Gold Urban's Buy Any 2, Get the 3rd Free appears in Welcome, Post-Purchase and Winback with "codes can't be combined."
- **Gift framing over discount framing** for emotional or occasion purchases (Ellaé Lisqué: 10% "presented as a gift, not a discount").

Every amount you set is marked *proposed for client approval* in the doc. Use the first-order AOV (**DATA**) to choose between percent and dollar offers.

## Flow rules

Same as the replenishable system: a purchase exits Welcome and the abandonment flows; one retargeting flow at a time (Checkout beats Browse beats Site Abandonment); flow filter "placed order 0 times since starting the flow" and Smart Sending off; re-entry off for Welcome, on for abandonment; SMS only with consent. Add for one-off brands:
- Offer exclusions stated on every email that carries a code (high-ticket, MAP-restricted, sale items, custom orders).
- "Codes cannot be combined" wherever an ongoing offer appears.
- Category rules from `industries-one-off.md` (regulated products, age gating, B2B routing).
