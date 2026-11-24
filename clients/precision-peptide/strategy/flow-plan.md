# The Precision Peptide Company — Flow plan
_Prepared 2026-11-24 · 22 emails + 7 SMS · Platform: Customer.io (flows are built by hand from the build sheets below)_

**Status: on hold. Compliance gate is ESCALATE.** Structure and timing are ready. Copy is written only after counsel approves claims, disclaimers, CTAs and offers (compliance.md).

## The system at a glance
1. **Pop-up** with one question (3 answers) → Welcome Email #1 has 3 versions
2. **Welcome:** 7 emails + 2 SMS
3. **Site abandonment:** 2 emails
4. **Browse abandonment:** 3 emails + 1 SMS
5. **Abandoned cart:** 4 emails + 2 SMS, with the mystery offer
6. **Post-purchase:** 4 emails + 1 SMS, with the plain-text founder email
7. **Winback:** 2 emails + 1 SMS

## Live flows vs the core system

| Live automation | Today | Verdict | What to do |
|---|---|---|---|
| Site sign-up Welcome | Stopped | **Build** | Replaced by the new Welcome. Archive. |
| Site sign-up Nurture (60 days) | Running · 2,028 sent · 4.6% open | **Fix** | Pause new entries once Welcome is live. Reuse its best emails as campaigns. |
| Welcome, X Leads | Running · 0 sent | **Fix** | Trigger is broken. Fold X and Reddit leads into the new Welcome. |
| OTC Welcome (ads) | Running · 223 sent · 0.9% open | **Fix** | Becomes Welcome track B (needle-free). Move to the main sender domain. |
| Amino active | Running · 0 sent | **Fix** | Ask what "Amino" is. Retire if it's an old list. |
| Amino list Nurture (60 days) | Draft | **Fix** | Same question. Don't launch as is. |
| Post Purchase Education | Running · 137 sent · 18.2% open | **Keep + fix** | Best opens in the account. Review its content for any use instructions, then extend to the 4-email version below. |
| Untitled Automation 1 | Draft | **Retire** | Empty draft. |
| Site abandonment | Missing | **Build** | Needs a page-view event. |
| Browse abandonment | Missing | **Build** | Needs a product-view event. |
| Abandoned cart | Missing | **Build** | Needs a checkout-started event. |
| Winback | Missing | **Build** | Runs off `order_created`. |

Source: Customer.io audit, Oct 25 to Nov 24, 2026.

## Events we need from their platform
- **Have:** `order_created` (with `order_value`)
- **Need before building**
  - `page_viewed` (site abandonment)
  - `product_viewed` with product name, URL, image (browse)
  - `checkout_started` with items and checkout URL (cart)
  - `popup_answer` stored as a customer attribute (welcome split)
- **Conversion goal on every flow:** `order_created` within 5 days

## Offer ladder (all proposed, max 25%, retail line only until counsel says otherwise)
- **Welcome #1–#4 + SMS #1:** 10% (W, code WELCOME10)
- **Welcome #5 + SMS #2:** 15% for 24 hours (WELCOME15)
- **Site abandonment:** none
- **Browse #2–#3:** 10%
- **Cart #3–#4:** mystery, "up to 25% off", real 15% (MYSTERY)
- **Post-purchase #2 and #4:** 15% second order
- **Winback:** 20%
- **Rx programs:** no discounts unless counsel approves

## Opt-in pop-up
- **Step 1 headline:** Want 10% off your first order?
- **Question:** What brings you to Precision Peptide?
  - Option 1: A company I can actually verify → track A (trust)
  - Option 2: A needle-free option → track B (Recovery Patch and retail)
  - Option 3: A prescription program → track C (eligibility check)
- **Step 2:** email · **Step 3:** SMS with consent line (skippable) · **Step 4:** code + one button
- **Why this question:** it maps to the three real entry points and stores `popup_answer` for later campaigns

## Welcome flow (7 emails + 2 SMS)
**Build sheet**
- Trigger: pop-up sign-up (segment "Form website_newsletter" or the new pop-up event), plus X and Reddit leads
- Filter: no `order_created` since entering
- Branch on `popup_answer`: A / B / C for Email #1 only, then one shared path
- Exit: `order_created`
- Re-entry: never

**Email #1 (v1, track A): A company you can look up**
- Send: immediately
- Goals: welcome, the 10% code, publicly listed + LegitScript + licensed clinicians, 3 entry products
- Talking to: the gray-market switcher, searching a vendor's name with "scam"

**Email #1 v2 (track B): No mixing, no measuring, no fridge**
- Send: immediately
- Goals: welcome, the code, the patch format, the retail range
- Talking to: the needle-averse buyer, moving vials around the fridge door

**Email #1 v3 (track C): Three steps to a clinician's answer**
- Send: immediately
- Goals: welcome, how the eligibility check works, 24-hour review, 503A pharmacy
- Talking to: the telehealth-first patient, halfway through an intake form

**SMS #1:** welcome + code + link (immediately after #1, consent only)

**Email #2: A note from Pratap** (plain text)
- Send: 4 hours later
- Goals: why the company exists, "done properly, done legally", invite a reply, soft code reminder

**Email #3: What people ask us first**
- Send: 1 day later
- Goals: the real FAQ (prescription, formats, testing, shipping) in place of reviews, since result reviews can't be used
- Talking to: the gray-market switcher, reading a forum argument at night

**Email #4: Where most people start**
- Send: 1 day later
- Goals: best first products (needs client data), one line each on format and handling

**Email #5: 15% for the next 24 hours**
- Send: 1 day later
- Goals: the upgraded code, the first direct ask, deadline
- Sending to: those who haven't ordered

**SMS #2:** upgraded code + 24-hour deadline (right after #5)

## Site abandonment (2 emails)
**Build sheet**
- Trigger: `page_viewed`, no product viewed, no checkout, no order
- Exit: product view, checkout or `order_created`, or entering browse/cart flows
- Re-entry: after 7 days

**Email #1: Were you checking us out?** (2 hours later)
- Goals: who the company is, the public listing, a soft link to protocols and shop

**Email #2: Where most people start** (1 day later)
- Goals: best sellers by format, no discount

## Browse abandonment (3 emails + 1 SMS)
**Build sheet**
- Trigger: `product_viewed`
- Filter: no checkout, no order, not in cart flow
- Exit: `checkout_started` or `order_created`
- Re-entry: after 7 days

**Email #1: Still looking at {{event.product_name}}?** (2 hours later)
- Goals: the viewed product, format facts only, why buying from a listed company matters
- Never: any benefit of the viewed product (SOP: no retargeting with benefits)

**Email #2: What sets us apart** (1 day later)
- Goals: the trust checklist, 10% browse code

**SMS #1:** reminder of the viewed product + link (right after #2)

**Email #3: Your code ends tonight** (1 day later)
- Goals: same code, deadline

## Abandoned cart (4 emails + 2 SMS)
**Build sheet**
- Trigger: `checkout_started`
- Exit: `order_created`
- Re-entry: after 1 day

**Email #1: You left this behind** (30 minutes later)
- Goals: cart items, one checkout button, no discount

**SMS #1:** cart reminder + checkout link (right after #1)

**Email #2: Questions before you check out?** (1 day later)
- Goals: shipping, discreet packaging, support contact, no discount

**Email #3: Your mystery discount** (1 day later)
- Goals: "up to 25% off", real 15%, code MYSTERY

**SMS #2:** mystery code + link (right after #3)

**Email #4: Last chance for your mystery discount** (1 day later)
- Goals: code ends at midnight, cart items, one button

## Post-purchase (4 emails + 1 SMS)
**Build sheet**
- Trigger: first `order_created`
- Re-entry: never
- Replaces "Post Purchase Education" once approved

**Email #1: Thank you** (plain text, from Pratap, 5 minutes later)
- Goals: thanks, shipping timeline, how to reach support, no offer

**SMS #1:** order thanks + support contact (right after #1)

**Email #2: What's in the box** (1 day later)
- Goals: storage and handling as printed on the label, where to find product documentation, who to ask
- Rx orders: point to the prescribing clinician for every use question, never instructions in email
- Below: 15% second-order code (retail only)

**Email #3: How did it go?** (plain text, from Pratap, 7 days later)
- Goals: did it arrive OK, was anything unclear, reply to us
- Ask for a review about service and delivery only, never results

**Email #4: Picked for you** (2 days later)
- Goals: other retail products by format, 15% code with expiry

## Winback (2 emails + 1 SMS)
**Build sheet**
- Trigger: `order_created` count = 1, then wait 90 days (set from reorder data once we have it)
- Filter: no order since entering
- Exit: `order_created`

**Email #1: What's new since your last order** (90 days later)
- Goals: new products and formats, 20% code, an easy way to tell us if something went wrong
- Never: "running low", "next round", "keep going"

**SMS #1:** what's new + code (right after #1)

**Email #2: Your code ends soon** (5 days later)
- Goals: same code, deadline, best sellers

## Build order
1. Fix the sender domain and authentication
2. Welcome (replaces three old welcomes)
3. Abandoned cart, once `checkout_started` exists
4. Post-purchase (upgrade the one that already gets opens)
5. Browse, then site abandonment
6. Winback
