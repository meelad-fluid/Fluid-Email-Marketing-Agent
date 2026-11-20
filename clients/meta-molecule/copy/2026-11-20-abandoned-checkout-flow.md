# Meta Molecule — Abandoned Checkout flow copy (4 emails + 2 SMS)

Status: draft · needs client approval · goes live once the automation is built in Customer.io

**Talking to:** the independent lab buyer, who stopped on the payment page to check one more thing in another tab (Email #1), who wants to know the paperwork is real before paying, with the cart sitting just under the $200 free-shipping line (Email #2), who is still weighing "do I add something or eat the shipping?" (Email #3), and who checks the clock before ordering because it needs to ship this week (Email #4).

From: Meta Molecule · Reply-to: support@metamolecule.com (to confirm)

Trigger (Customer.io): `checkout_started` · Exit: `placed_order` · Re-entry: after 1 day · Conversion goal: `placed_order` within 5 days. Retargeting priority: Checkout beats Browse beats Site Abandonment.
Dynamic cart block (every email, right under the hero button): per line, product image, catalog name + size, quantity, price; a "Specs" link to the product page; cart subtotal. Every button returns to the saved checkout URL (`event.checkout_url`, fallback https://metamolecule.com/checkout/). Never show held products (Reta, Tirz, GLOW, CEO in a Bottle, strips, capsules, Amino H2O/BAC water): if the cart holds one, suppress the flow for that person. Designs show a sample cart: MOTS-C 40mg ×1 ($119) + Tesamorelin 10mg ×1 ($60) = $179.
Email #2 dynamic line: if subtotal < $200 → "You're $[200 − subtotal] from free U.S. shipping." If ≥ $200 → "Your order ships free in the U.S."

## NOTES
**Compliance gate: PASS — READY FOR HUMAN REVIEW** (classification cleared by the Fluid team in Slack, 2026-11-19).
- Tests 1–4, 7: no human benefit, medical, use or dosing language; products by catalog name and size only; imagery = real site product photos, lab equipment, documents, shipping boxes. PASS.
- Test 5: only verified facts (public COA library at /coas; same-day shipping before 1 p.m. CT Mon–Fri; free U.S. shipping at $200 after discounts; no returns once shipped, damaged/incorrect items go to support). Strategy's Email #2 topic "Every item in your cart has a COA" changed to "check the documentation before you pay": per-lot COA coverage is still HOLD. PASS.
- Test 5 (offer): the strategy's teaser "up to 25% off" is dropped. MYSTERY is 15% for everyone, so "up to 25%" would promise something no one can get. Copy says "mystery discount, revealed at checkout". Add the range back only if some codes really give 25%.
- Test 8: default disclaimer until the brand approves its own. Test 9: MYSTERY (15%, single use, expires 11:59 p.m. CT the day Email #4 sends; not combinable with other codes or Buy 2 Get 1) and the SMS disclosure are proposals; a person at Fluid approves before live.
- CTAs: transactional CTAs aren't approved yet, so the main button is "Review Your Order" (goes to the saved checkout). Swap to "Complete Checkout" once approved. Others: View COA Library, Contact Support (Title Case).
- Attach item (strategy Email #2): bundles have no real site photo, so no bundle tile is designed; the free-shipping line does the job. Optional build-time line if a cart item is in a catalog bundle: "Also in the [bundle name], $[price]."
- Disclaimer line (body + footer): FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

---

## Email #1 — 30 minutes after checkout started
Subject: Stopped to check one more thing?
Preview: Your order is saved. Order by 1 p.m. CT and it ships today.

Hero kicker: Your order is saved
Hero headline: Stopped to check one more thing?
Subheadline: Fair. Your order is right where you left it, same items, same price.
Button: Review Your Order

Section title: Your order
Dynamic cart block · Button: Review Your Order · Disclaimer line under it.

Section — Ships today
Heading: Order by 1 p.m. CT. It ships today.
Body: Monday to Friday, from the U.S. Free shipping on orders $200+ after discounts.

Help banner
Heading: Something holding you up?
Body: Reply to this email. A person on our team reads every reply.
Buttons: Contact Support · Review Your Order

## SMS #1 — right after Email #1
Meta Molecule: Your order is saved. Pick up where you left off: {{ event.checkout_url }} For research use only. Reply STOP to opt out.

## Email #2 — 1 day later
Subject: Check the paperwork before you pay
Preview: Our COA library is public. Open it, then finish your order.

Hero kicker: Before you pay
Hero headline: Check the paperwork. Then check out.
Subheadline: Our COA library is public. No login, no request form, nothing to take on trust.
Button: Review Your Order

Dynamic cart block · Dynamic free-shipping line · Button: Review Your Order · Disclaimer line under it.

Section — That's me
Heading: You've paid for a screenshot before.
- The "COA" was a cropped image.
- No lab name. No date.
- No lot number to match to the vial.
Body: So you stopped at the payment page. Good instinct.

Section — The fine print, plainly (3 rows)
01 — Documentation: Our COA library is public. Open it before you pay.
02 — Shipping: Order by 1 p.m. CT, Monday to Friday, and it ships today. Free U.S. shipping on $200+ after discounts.
03 — Once it ships: No returns once shipped, so we say it up front. Damaged or incorrect item? Contact support with your order number.
Button: View COA Library

Help line: Questions about a spec? Reply to this email. · Ghost button: Contact Support

## Email #3 — 1 day later
Subject: There's a mystery discount on your order
Preview: Enter MYSTERY at checkout to reveal it. Ends 11:59 p.m. CT tomorrow.

Hero kicker: Just for your order
Big offer: ??% OFF · Code chip: MYSTERY
Hero headline: We put a mystery discount on your order.
Subheadline: Enter MYSTERY at checkout to reveal it. Single use, ends 11:59 p.m. CT tomorrow.
Small line: Can't be combined with other codes or the Buy 2 Get 1 promotion.
Button: Review Your Order

Dynamic cart block · Button: Review Your Order · Disclaimer line under it.

Section — How it works (3 steps)
01 — Open your saved order.
02 — Enter MYSTERY in the coupon field.
03 — Your discount shows in the total.

Section — That's me
Heading: Add something, or eat the shipping?
Body: Apply MYSTERY first, then see where your total lands. Free U.S. shipping counts orders $200+ after discounts.

Deadline banner
Heading: MYSTERY ends 11:59 p.m. CT tomorrow.
Code chip: MYSTERY · Button: Review Your Order

## SMS #2 — right after Email #3
Meta Molecule: There's a mystery discount on your saved order. Code MYSTERY, ends 11:59 p.m. CT tomorrow: {{ event.checkout_url }} For research use only. Reply STOP to opt out.

## Email #4 — 1 day later
Subject: Your mystery code ends tonight
Preview: MYSTERY ends at 11:59 p.m. CT. Order by 1 p.m. CT and it ships today.

Hero kicker: Last call
Big offer: ??% OFF · Code chip: MYSTERY
Hero headline: Last call. Your code ends tonight.
Subheadline: MYSTERY is still on your order until 11:59 p.m. CT. Order by 1 p.m. CT and it ships today.
Button: Review Your Order

Dynamic cart block · Button: Review Your Order · Disclaimer line under it.

Closing banner
Heading: One step left.
Body: Enter MYSTERY at checkout. Single use, ends 11:59 p.m. CT tonight. Can't be combined with other codes or the Buy 2 Get 1 promotion.
Code chip: MYSTERY · Button: Review Your Order
