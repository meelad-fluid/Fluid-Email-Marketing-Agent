# Georg Roth Los Angeles — Core flow plan
_Status: draft · needs client approval · Prepared 2026-11-26_

**The plan in one line:** build the full core system in Klaviyo (22 emails + 7 SMS), with fit help in every flow and every offer at 10% or less.

**Version:** one-off (apparel). Post-purchase makes him glad he bought. Upsell = the complete look. Winback = a wardrobe refresh.

**Live flows today**
- The Klaviyo audit returned no flow data and they send from Mailchimp (brief)
- The only flow they mention is a welcome 10% off (brief)
- So every flow below is marked **build**, and the welcome is **fix** (move it into Klaviyo and rebuild it)

| Flow | Status | Why |
|---|---|---|
| Pop-up | Fix | Welcome 10% exists (tool unknown). Rebuild in Klaviyo with the question. |
| Welcome (7 emails + 2 SMS) | Fix | 10% welcome exists. Rebuild as the full series. |
| Site abandonment (2) | Build | Not live in Klaviyo |
| Browse abandonment (3 + 1 SMS) | Build | Not live in Klaviyo |
| Abandoned cart (4 + 2 SMS) | Build | Not live in Klaviyo |
| Post-purchase (4 + 1 SMS) | Build | Not live in Klaviyo |
| Winback (2 + 1 SMS) | Build | Not live in Klaviyo |

**Offer ladder (10% cap from the brief)**
- **Welcome:** 10% off (their current offer)
- **Welcome #5 upgrade:** 10% + free shipping on any order, 24 hours (normally free over $150)
- **Browse:** no new code. Fit help + the welcome 10% if they hold it.
- **Abandoned cart mystery:** "Unlock your mystery offer" → 10% + free shipping
- **Post-purchase:** 10% on the second order
- **Winback:** 10% + free shipping
- All codes: "can't be combined" and return terms stated

---

## Pop-up — Fix

**Step 1: Want 10% off your first order?**
- Question: "What are you shopping for?"
  - **Everyday tees and essentials** → Email #1
  - **Golf and belts** → Email #1 v2
  - **A gift for him** → Email #1 v3
- Creative: navy Pima tee, folded stack, LA light

**Step 2: Where should we send it?**
- Sub: 10% off your first order, plus our fit guide so you get the size right the first time
- Button: Continue

**Step 3: Want it texted to you too?**
- Sub: Early access to new colors and restocks. A few texts a month.
- Button: Yes, Text Me · Secondary: No thanks, email is fine
- Standard SMS consent line

**Step 4: You're in.**
- Sub: Your code is [WELCOME10] for 10% off. It's in your inbox now.
- Button: Shop Pima Tees

---

## Welcome Flow — Fix (7 emails + 2 SMS)
- **Trigger:** added to the pop-up list
- **Filter:** placed order zero times since starting the flow
- Split on the pop-up answer for Email #1. #2–#5 and both SMS are the same on every track.

**Email #1 · Immediately · Everyday tees and essentials**
- Topic: "Welcome. Here's 10% off the tee people come back for."
- Goals:
  - The code and where it works
  - Short brand line: luxury Pima, real fit help
  - Three picks: short-sleeve crew, V-neck, 3-pack
  - Fit basics: trim fit, size up for room
  - Free shipping over $150

**Email #1 v2 · Immediately · Golf and belts**
- Topic: "Welcome. Here's 10% off for the course and the clubhouse."
- Goals:
  - Same code and brand line
  - Three picks: stretch golf belt, polo, shorts by length
  - Belt rule: one size above your pant size

**Email #1 v3 · Immediately · A gift for him**
- Topic: "Welcome. Here's 10% off a gift he'll actually wear."
- Goals:
  - Same code and brand line, written to the person buying for him
  - Three picks: 3-pack, belt, car-metal cuff
  - "Send us his usual size, we'll check it"
  - Holiday or gift return terms

**SMS #1 · Right after Email #1**
- "Welcome to Georg Roth. Here's 10% off your first order: WELCOME10. [link]"

**Email #2 · 4 hours · A note from Georg (plain text)**
- His story in five lines: Germany at 17, Milan's markets, finding home in LA
- What he won't compromise on: fabric and fit
- "Reply and tell me what you're looking for"
- Soft reminder of the code

**Email #3 · 1 day · What people say about Georg Roth**
- Real reviews only, situation → outcome (needs your review export)
- 4.7/5 rating and where it lives
- Code reminder

**Email #4 · 1 day · Our best sellers, and who each is for**
- Guided tour: Pima tees, polos, belts, shoes
- One line on who each is for
- Size help on every block

**Email #5 · 1 day · Your offer just got better, for 24 hours**
- 10% + free shipping on any order, 24 hours only
- First direct ask to shop
- Exact end time

**SMS #2 · Right after Email #5**
- "24 hours only: 10% off + free shipping on any Georg Roth order. Code [WELCOMEPLUS]. [link]"

---

## Site Abandonment Flow — Build (2 emails)
- **Trigger:** active on site, no product viewed, no cart, no order
- One retargeting flow at a time. Re-entry after 7 days.

**Email #1 · 2 hours · "Were you just checking us out?"**
- What Georg Roth is: luxury Pima, real fit help
- "We call every customer to check the fit" (once confirmed)
- Soft CTA: Explore the Collection

**Email #2 · 1 day · "Here's where most men start"**
- Best sellers with one practical line each
- Welcome code only if they still hold it

---

## Browse Abandonment Flow — Build (3 emails + 1 SMS)
- **Trigger:** viewed product, no cart, no order
- Re-entry after 7 days

**Email #1 · 2 hours · "Still thinking about this?"**
- Dynamic block: the product they viewed
- Answer the fit doubt for that category (tee, belt, shoe rule)
- "Reply and we'll pick your size"

**Email #2 · 1 day · "Here's what it's like to wear"**
- Reviews for the viewed category
- Complete-look pairing
- Welcome 10% reminder if they hold it, no new code

**SMS #1 · Right after Email #2**
- "Still thinking about the [product]? Here it is: [link]"

**Email #3 · 1 day · "Buy it once, in the right size"**
- The viewed product is still waiting
- Size guide + returns in plain words

---

## Abandoned Cart Flow — Build (4 emails + 2 SMS)
- **Trigger:** started checkout
- **Filter:** placed order zero times since starting the flow. Re-entry after 1 day.

**Email #1 · 30 min · "Your order is almost complete"**
- Headline → sub → button → cart table → button
- No discount

**SMS #1 · Right after Email #1**
- "You left something in your Georg Roth cart. Finish here: [link]"

**Email #2 · 1 day · "Not sure about the size?"**
- Cart table
- Fit rule for what's in the cart + "Reply and we'll check it"
- Attach item: belt with pants, 3-pack with a single tee

**Email #3 · 1 day · "Unlock your mystery offer"**
- Mystery reveal at checkout: 10% + free shipping (code [MYSTERY])
- Cart table, exclusions

**SMS #2 · Right after Email #3**
- "Your mystery offer is waiting at checkout. Ends soon: [link]"

**Email #4 · 1 day · "Last chance for your mystery offer"**
- Expires at midnight
- Cart table, one checkout button

---

## Post-Purchase Flow — Build (4 emails + 1 SMS)
- **Trigger:** placed order, first order only

**Email #1 · 5 min · "Thank you" (plain text, from Georg)**
- Thanks him by name
- "We'll call you in the next day to check the size" (matches their service)
- Shipping times
- Reply for anything

**SMS #1 · 1 day**
- "Thanks for your Georg Roth order. Need a different size? Reply here and we'll sort it."

**Email #2 · 1 day · "How to wear and care for your Pima"**
- Wash cold, hang dry, light iron if needed (confirm care with client)
- Three ways to wear it
- Exchanges in plain words
- Below: 10% second-order code + pairings

**Email #3 · 7 days · "How's the fit?" (plain text, from Georg)**
- Ask for a review with a photo
- Invite a reply if anything's off

**Email #4 · 2 days · "Complete the look"**
- Pairings: tee → belt, pants, shoes. Polo → golf belt.
- "Need another color?"
- 10% second-order code with a clear end date

---

## Winback Flow — Build (2 emails + 1 SMS)
- **Trigger:** placed order, first-time customers who haven't reordered
- **Wait:** 120 days (one-off apparel; reset once Shopify data shows the real reorder gap)

**Email #1 · 120 days · "Time for a fresh stack?"**
- New colors and arrivals
- Recommendations from what he bought
- 10% + free shipping code

**SMS #1 · Right after Email #1**
- "New Pima colors are in. 10% + free shipping is yours this week: [code]. [link]"

**Email #2 · 5 days · "Your offer ends Sunday"**
- Same code, clear end time
- One CTA to his recommended collection

---

## Count check
- **Emails: 22**
  - Welcome 7 · Site 2 · Browse 3 · Cart 4 · Post-purchase 4 · Winback 2
- **SMS: 7**
  - Welcome 2 · Browse 1 · Cart 2 · Post-purchase 1 · Winback 1
