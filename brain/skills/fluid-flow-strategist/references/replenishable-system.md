# Fluid's flow system — replenishable brands

**Who it's for:** supplements, peptides, skin care, hair care, cosmetics, CPG (food, drink, consumables), and anything else customers use up and rebuy, such as wearable patches.

**How these customers buy:** they use the product up and have to buy again. They need to *use it properly* to get the result, and the result is what earns the reorder. So the system's job is to get the first order, teach them to use it, check the result is showing up, and get the second order before the habit fades. The upsell is the next product in the routine, a bundle, a subscription, or simply the reorder.

This file is distilled from Fluid's 16 replenishable strategies (EVO Labs, PeptiNova, Driven Ones, Puregenix, Stemox, Beyond Slim, Moneta, Xtressé, Forever Bloom, Sinister Love, SPQR, El Viejon, LEVL, OOKA, ANF Care) and Gloria's description of the master system. The structure and the default timings below are what those docs do almost without exception. **Don't add, drop or merge emails.** Departures go in the plan as recommendations (SKILL.md, Step 4).

Items marked **DATA** are slots that the client's Hiro data fills (see `hiro-flow-data.md`). Items marked **BRAND** come from the client's website, brief or onboarding call; if you can't find them, leave a labeled placeholder.

## Contents

- [Opt-in pop-up](#opt-in-pop-up)
- [Welcome flow](#welcome-flow-7-emails--2-sms)
- [Site abandonment](#site-abandonment-flow-2-emails)
- [Browse abandonment](#browse-abandonment-flow-3-emails--1-sms)
- [Abandoned checkout](#abandoned-checkout-flow-4-emails--1-sms)
- [Post-purchase](#post-purchase-flow-4-emails)
- [Winback](#winback-flow-2-emails)
- [Optional flows](#optional-flows)
- [Offer ladder](#offer-ladder)
- [Flow rules](#flow-rules)

## Opt-in pop-up

The capture device that turns site traffic into list subscribers. The whole point is the **highest submit rate possible**; Fluid's target is 10%+.

**Step #1: Teaser + Collect Zero Party Data**
- **Headline:** "Want [offer]?" The offer is the client's discount, a percent or dollar amount off (**BRAND**). The reference docs run 5% to 20%; 10% is the most common.
- **Question + 3 options.** The answer decides which version of Welcome Email #1 they get, so each option must map to products. Question styles that have worked:
  - Goal: "What is your primary wellness goal right now?" (supplements)
  - Product type: "What are you shopping for today?" Salts / Seasoning Blends / ... (CPG)
  - Preference: "How do you like your jerky?" (CPG)
  - Pain point: "What's the hardest part of staying consistent?" (Moneta)
  - Research category: "What are you researching right now?" (peptides)
- **DATA:** the three options come from the product groups new customers actually start with. For a goal question, map each goal to the products that serve it and check the three groups are each a real share of first orders.

**Step #2: Collect Email.** Newer docs write the copy: headline, sub-headline (what they get), field, button, optional trust line under the button.

**Step #3: Collect SMS.** Optional for the subscriber, on its own step. Angle it on what SMS gets them (restock alerts, new flavors, early access). Include the consent line (recurring messages, rates may apply, reply STOP).

**Step #4: Confirmation.** The code, where it works, and one button to shop.

Optional **Strategy** note under the pop-up (as in LEVL): why this question, which profile property the answer is stored as, and that the headline offer is exactly what they get (the Email #5 upgrade is never promised up front).

## Welcome Flow (7 Emails + 2 SMS)

The 7 emails are Email #1's three versions plus Emails #2–#5. Each subscriber receives one version of Email #1, so they get 5 emails.

**Flow note:** Trigger: added to the pop-up list. Flow filter: placed order 0 times since starting the flow. Split: conditional split on the pop-up answer, routing to the three versions of Email #1.

**Purpose:** engage new subscribers, educate them on the company, position the brand as the leader in its industry, get the first purchase, and keep reminding them of the welcome offer.

### Email #1: Welcome Offer (Option #1 – [answer]) · Email #1 v2 (Option #2) · Email #1 v3 (Option #3)
- **Send Time:** Immediately after sign up
- **Email Topic:** "Welcome to [Brand]! Here's your [offer]", or a topic built on their answer ("Something to reach for at 3pm that isn't coffee")
- **Design:** Yes
- **Sending to:** New subscribers who selected Option #N
- **Goals**, in this order (the reference docs keep the order):
  - Welcome to the brand
  - Give them their [offer], with **Code** and **Value**
  - Go over the brand mission (**BRAND**)
  - Highlight the benefit they chose in the pop-up, in their words, and how the brand delivers it
  - Highlight their best-selling products: 3 products for this option (**DATA**), one line each on what it is
  - Optional: trust signals (testing, certifications, review count), subscription or bundle options, a secondary CTA
- Same messaging and offer in all three versions; the products and the benefit paragraph change.

**Conditional Split:** If they subscribed to SMS
### SMS #1
- **Send Time:** Immediately after Email #1
- **Goals:** Welcome them to the brand and give them the code.

### Email #2: Personal Note from the Founder
- **Send Time:** 4 hours later
- **Design:** Plain text. Never designed: it reads as personal and is the highest-trust email in the flow.
- **Sending to:** New subscribers
- **Goals:** the founder's story by name (**BRAND**), why the brand exists, the decision it made on purpose (quality over margin, taking ingredients out), invite a reply, soft reminder of the code.

### Email #3: Customer Reviews
- **Send Time:** 1 day later · **Design:** Yes · **Sending to:** New subscribers
- **Goals:** authentic reviews, before/after stories, customer photos, review count (**BRAND**); reassure the main objection for the category (taste, does it work, will it match my skin); remind them of the code.

### Email #4: Best Seller Showcase
- **Send Time:** 1 day later · **Design:** Yes · **Sending to:** New subscribers
- **Goals:** the core products (**DATA**), how each one fits a need, the easiest place to start.

### Email #5: Upgrade offer for only 24 hours
- **Send Time:** 1 day later · **Design:** Yes · **Sending to:** New subscribers who have not purchased
- **Goals:** upgrade the offer for 24 hours (see the offer ladder), make the first direct ask to shop, plus subscription or rewards if the client has them.

### SMS #2
- **Send Time:** Immediately after Email #5
- **Goals:** the upgraded code and the 24-hour deadline.

## Site Abandonment Flow (2 Emails)

**Flow note:** Trigger: active on site, no product viewed, no add to cart, no order. Exclude anyone in the Browse or Checkout flows.

**Purpose:** get them back onto the site and remind them the brand exists. Top of funnel, so **no new discount**. Mention the welcome offer only if they still hold it.

### Email #1
- **Send Time:** 2 hours later · **Email Topic:** "Were you just checking us out?" · **Design:** Yes · **Sending to:** Site visitors who left without viewing a product
- **Goals:** answer the questions a first-time visitor has, show social proof, and hook them with what's popular about the brand: the unique mechanism, or the reason the brand is the brand (**BRAND**).

### Email #2
- **Send Time:** 1 day later · **Email Topic:** "Take a look at these best sellers" · **Design:** Yes
- **Goals:** best sellers (**DATA**) and the problem each one solves.

## Browse Abandonment Flow (3 Emails + 1 SMS)

**Flow note:** Trigger: viewed a product, no add to cart, no order. Exclude anyone in the Checkout flow.

**Purpose:** window shoppers are probably looking at competitors too. Position the brand better than the competition.

### Email #1: Reminder
- **Send Time:** 2 hours later · **Email Topic:** "Still thinking about this?" · **Design:** Yes · **Sending to:** Window shoppers
- **Goals:** dynamic block with the viewed product; why this one beats the alternatives (ingredients, testing, results, value).

### SMS #1
- **Send Time:** Immediately after Email #2 *(what most reference docs do; a few pair it with Email #1)*
- **Goals:** simple reminder of what they were viewing.

### Email #2: Reminder + Social Proof + Incentive
- **Send Time:** 1 day later · **Email Topic:** "Everyone is loving [Brand]" · **Design:** Yes
- **Goals:** reviews tied to the viewed product or category; the browse incentive (code + value); reduce friction (guarantee, free-shipping threshold).

### Email #3: Reminder + Incentive Expiry
- **Send Time:** 1 day later · **Email Topic:** "Sh… Don't tell anyone about this" · **Design:** Yes
- **Goals:** the viewed product is still waiting, the code expires tonight.

## Abandoned Checkout Flow (4 Emails + 1 SMS)

**Flow note:** Trigger: started checkout, no order. Re-entry on: people abandon more than once.

**Purpose:** push them over the edge. They're already interested; remind them, then give them an offer they can't resist.

### Email #1: Simple Reminder
- **Send Time:** 30 minutes later · **Email Topic:** "I think you forgot this…" · **Design:** Yes · **Sending to:** People who abandoned their cart
- **Goals:** simple reminder, no discount; dynamic table showing their cart.
- **Email structure:** Headline → Sub headline → Button → Dynamic Table → Button

### SMS #1
- **Send Time:** Immediately after Email #1
- **Goals:** simple reminder about the items in their cart.

### Email #2: Reminder + Social Proof
- **Send Time:** 1 day later · **Email Topic:** "Here's what people are saying about [Brand]" · **Design:** Yes
- **Goals:** dynamic table; reviews for what's in the cart; a bundle or attach item (**DATA**: what's most often bought with it).

### Email #3: Mystery Discount
- **Send Time:** 1 day later · **Email Topic:** "Grab your MYSTERY Discount" · **Design:** Yes
- **Goals:** excitement and urgency; "Get up to 30% off"; the code reveals the real value at checkout. **Code:** MYSTERY · **Value:** see the offer ladder.

### Email #4: Mystery Discount
- **Send Time:** 1 day later · **Email Topic:** "Last chance for your mystery discount" · **Design:** Yes
- **Goals:** the code expires at midnight; dynamic table; one checkout button.

## Post-Purchase Flow (4 Emails)

**Flow note:** Trigger: placed order. Don't duplicate the store's transactional confirmation.

**Purpose:** make the first order go well, teach them to use it, collect the review, and drive the second order.

### Email #1: Thank You + Order Confirmation
- **Send Time:** 5 minutes later · **Design:** Plain text · **Sending to:** New customers
- **Goals:** from the founder; thank them for trusting the brand; build a personal connection; set shipping expectations so nobody has to email support; offer support. No offer.

### Email #2: How to use the product (+ second-purchase offer)
- **Send Time:** 1 day later, so the instructions are waiting when the order arrives
- **Design:** Yes · **Sending to:** New customers
- **Goals:** how to use it for the best result: how much, when, with what, what to expect and when (see `industries-replenishable.md` for each category's version). This is the email that protects the reorder, because people who use it wrong don't see results and don't come back. Then, held below the teaching, the second-purchase code, and subscription or membership if the client has it.

### Email #3: Plain text email from the founder
- **Send Time:** 7 days later · **Design:** Plain text · **Sending to:** New customers
- **Goals:** "How's it going?", asked as the specific question only this brand can ask ("Did you finish the can?", "Did the COA check out?"); ask for the review at the moment they've formed an opinion; invite a reply. No discount, no product grid.

### Email #4: Upsell Offer
- **Send Time:** 2 days later · **Design:** Yes · **Sending to:** New customers
- **Goals:** recommend the next product based on what they bought, written as a pairing map ("Bought X → recommend Y and Z", **DATA**); the second-purchase code; subscription, bundle or volume set as the better standing deal; the free-shipping threshold as a basket builder.

## Winback Flow (2 Emails)

### Email #1: We miss you
- **Send Time:** after the brand's customer lifecycle: past the natural reorder point, before the habit is gone (**DATA**: see `hiro-flow-data.md`). The reference docs estimated this from supply size (a 30-day supply → 45 days); Hiro gives the real number. If product groups reorder on very different cycles, split the timing by group, as SPQR did (seasonings 60 days, large-format salts 90).
- **Design:** Yes · **Sending to:** First-time customers who have never purchased again
- **Goals:** what's changed since they left (new products, flavors, batches); a reorder block with what they bought before; the winback code (most reference docs put it in this email); an easy way to tell the brand if something went wrong.

### Email #2: Come back offer
- **Send Time:** 3–7 days after Email #1 · **Design:** Yes
- **Goals:** the same code with a clear expiry; best sellers or the bundle; subscription for anyone who'd otherwise lapse again.

## Optional flows

Propose these in the plan with the number that justifies them. Build them only if approved.

**Replenishment Flow (2 Emails + 1 SMS)**, as in EVO Labs and PeptiNova. Propose it when the data shows a real same-product reorder habit (see `hiro-flow-data.md`) and the client has no replenishment flow running.
- Trigger: time since purchase, **per product group** (**DATA**: each group's median days to second order). EVO ran 21 / 30 / 45 days by format.
- Email #1 "Running low on {{ product }}?": at the window. No discount, because a customer who's genuinely low reorders at full price and discounting the first touch trains the list to wait for a code. Dynamic reorder block; attach items; subscription.
- SMS #1: immediately after Email #1.
- Email #2 "Last call before you run out": 5–7 days later, a restock code (~15%) with a 72-hour expiry; the bundle or volume set side by side as the smarter option.
- Suppress anyone who has reordered, anyone in the Checkout flow, and active subscribers (who get a member version or nothing).

**Sunset / Re-engagement Flow (3 Emails)**, as in Beyond Slim. Propose it for clients with large imported or inactive lists. 120 days of no opens, clicks or purchases → "We miss you" with an incentive; +5 days "Last chance to stay connected"; +3 days a plain-text "confirm you want to hear from us". Unsubscribe non-confirmers to protect sender reputation.

## Offer ladder

What the reference docs did, anchored on the client's welcome offer (W):

| Where | Default | Seen in the docs |
|---|---|---|
| Pop-up, Welcome #1–#4, SMS #1 | W | 5%–20%, most often 10% |
| Welcome #5 + SMS #2 | W + 5 points, 24 hours | 10→15, 15→20, 5→10 |
| Site Abandonment | none | welcome code mentioned if still valid |
| Browse #2–#3 | about W | often a brand code at W (SPQR10, MONETA10) |
| Checkout #3–#4 | "Up to 30% off", real 15% (20% when W is 15%+) | MYSTERY / MYSTERY15 |
| Post-Purchase #2 and #4 | second-purchase code, 10–20% | SECOND15, EVOAGAIN20, LEVLNEXT10 |
| Winback #1–#2 | 15–25%, the ceiling offer | COMEBACK20, WINBACK15, COMEBACK25 |
| Replenishment #2 (optional) | ~15%, 72-hour expiry; none in #1 | RESTOCK15, REPLENISH15 |

**Subscription, membership and rewards come first where the client has them.** Xtressé framed Monthly Delivery (save 10%) and 3-Month Delivery (save 20%) as the routine; LEVL held its second-purchase code at 10% so Subscribe & Save at 15% stayed the obvious upgrade; EVO pushed its membership with the arithmetic. If the client runs one, it leads Post-Purchase #2 and #4 and Winback, and the codes become the fallback.

Every amount you set is marked *proposed for client approval* in the doc. Use the first-order AOV (**DATA**) to sanity-check: on high AOV, a dollar amount or a smaller percent may protect margin.

## Flow rules

The doc ends with these, adjusted to the client:

- A purchase exits Welcome, Site Abandonment, Browse Abandonment and Abandoned Checkout.
- One retargeting flow at a time, by intent: Checkout beats Browse, and Browse beats Site Abandonment.
- Flow filter on Welcome and the abandonment flows: placed order 0 times since starting the flow. Smart Sending off.
- Re-entry off for Welcome; on for the abandonment flows.
- Non-converters from the discount flows are suppressed from further flow discounts for a period (LEVL used 60 days), so the list doesn't learn to wait for codes.
- SMS only to contacts with SMS consent.
- Category-specific rules from `industries-replenishable.md` (peptide compliance review before every send, age gating, claims rules).
