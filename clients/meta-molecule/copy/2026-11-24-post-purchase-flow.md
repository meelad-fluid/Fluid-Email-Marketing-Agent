# Meta Molecule — Post-Purchase flow copy (4 emails + 1 SMS)

Status: draft · needs client approval · goes live once the automation is built in Customer.io

**Talking to:** the independent lab buyer who just placed a first order with a new supplier and is already asking "Did it ship yet?" (Email #1), who is opening the box and checking the label against the order and the paperwork (Email #2), who has the vial on the bench and the COA open and wants to know who to tell if they don't match (Email #3), and who is planning the next order with the cart sitting just under the $200 free-shipping line (Email #4).

From: #1 and #3 Claire from Meta Molecule (plain text) · #2 and #4 Meta Molecule (designed) · Reply-to: support@metamolecule.com (to confirm)

Trigger (Customer.io): `placed_order` where order count = 1 · Exit: a second `placed_order` (for #2's and #4's offer only: suppress the SECOND15 blocks once they've ordered again) · Re-entry: never · Conversion goal: `placed_order` within 5 days of #4. Doesn't replace WooCommerce's order confirmation or shipping emails.
Held products (Reta, Tirz, GLOW, CEO in a Bottle, strips, capsules, Amino H2O) never appear in a dynamic block; if they're the only line items, show the block without them / fall back to the starting products.

## NOTES
**Compliance gate: PASS — READY FOR HUMAN REVIEW** (classification cleared by the Fluid team in Slack, 2026-11-19).
- Tests 1–4, 7: no human benefit, medical, use or dosing language; nothing about what the material is for; products by catalog name and size only; imagery = real site product photos, lab equipment, shipping boxes, document graphics. PASS.
- Test 5: only verified facts (same-day shipping before 1 p.m. CT Mon–Fri; free U.S. shipping at $200 after discounts; no returns once shipped, damaged/incorrect items go to support; COA library public at /coas). We never say the buyer's lot COA is published (per-batch coverage is HOLD): #2 says "look your lot up", and if it isn't there, reply with the lot number. No "next business day" promise (not on the site). Storage line points to the label only (storage specs not published, client to confirm). PASS.
- Test 6: review request (#3) asks only about what's verifiable (paperwork, packaging, shipping, support) and says plainly we can't publish anything about use. Review platform: client to choose (link goes to the site until then).
- Test 8: default disclaimer until the brand approves its own. Test 9: SECOND15 (15% off the second order, expires 7 days after #4) and the SMS disclosure are proposals; a person at Fluid approves before live.
- Pairing map (#4 dynamic block): products that share a catalog bundle with what they ordered (Tesamorelin → CJC/IPA blend, SLU-PP-332; MOTS-C → SS-31; CJC/IPA blend → Tesamorelin; BPC157/TB500 → BPC-157, TB-500; Semax ↔ Selank, Dihexa), excluding what they already bought; fallback = MOTS-C 40mg, BPC157/TB500 Blend, Tesamorelin 10mg. Replace with order data once it's in.
- CTAs: Review Specifications, View COA Library, Explore Research Catalog, Contact Support (Title Case).
- Disclaimer line (body + footer): FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

---

## Email #1 — 5 minutes after the order (plain text, from Claire)
Subject: Thank you, {{ customer.first_name | default: "there" }}
Preview: Not your receipt. Just what happens next.

Hi {{ customer.first_name | default: "there" }},

Your order's in. The receipt is already in your inbox, so this isn't that. It's a thank-you from the team for trying a new supplier.

Here's what happens next:
- Placed before 1 p.m. CT, Monday to Friday? It ships today.
- Tracking comes by email as soon as it's on its way.
- U.S. shipping only, straight from our team.

One thing we'd rather say now than later: we can't take returns once an order ships. So when the box arrives, check the labels against your order. If anything is damaged or not what you ordered, email support@metamolecule.com with your order number and we'll sort it out.

Any question at all, just reply. A person reads every one.

Claire
Meta Molecule

FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

## SMS #1 — right after Email #1 (SMS consent only)
Meta Molecule: Thanks for your order. Orders before 1 p.m. CT Mon–Fri ship today, and tracking follows by email. Questions? Reply here. For research use only. Reply STOP to opt out.

## Email #2 — 1 day later (designed)
Subject: Match your vial to its paperwork
Preview: Lot number, COA library, done. Plus 15% off your next order.

Hero kicker: Your order is on its way
Hero headline: Label in one hand. Paperwork in the other.
Subheadline: When it arrives, check the lot number on the label against our COA library. It takes a minute.
Offer: 15% off your next order · Code chip: SECOND15
Button: View COA Library

Dynamic block — "In your order": ordered items (image, name + size, qty) · Button: Review Specifications · Disclaimer line under it.

Section — That's me
Heading: You've had a vendor send the COA after the box.
Body: Or never. That's why ours is public before you pay, and why the lot number on your label is the first thing to check.

Section — Three steps (numbered)
Heading: Check your order in three steps
01 — Find the lot number: it's printed on the vial label.
02 — Look it up: open our COA library and search that lot.
03 — Can't find it? Reply with the lot number and our team will look into it.
Button: View COA Library

Section — If something's off
Heading: Damaged or not what you ordered?
Body: We can't take returns once an order ships, so check the box when it lands. Email support with your order number and we'll sort it out.
Body (small): Store everything as stated on its label.
Button: Contact Support

Offer close
SECOND15 · 15% off your next order
Button: Explore Research Catalog

## Email #3 — 7 days later (plain text, from Claire)
Subject: Did the paperwork check out?
Preview: One honest question about your first order.

Hi {{ customer.first_name | default: "there" }},

Your order should have landed by now, so I wanted to ask the one question we care about most: did the lot on your label match the documentation?

If it did, a quick review would help other labs who are where you were a week ago, comparing vendors in three tabs. Keep it to what you could check: the paperwork, the packaging, how fast it shipped and how we answered. We can't publish anything about how a product is used, so we'll leave those out.

Leave a quick review: [review link — platform to confirm]

If it didn't match, or anything else wasn't right, reply to this email. I'd much rather hear it from you now than find out later.

Claire
Meta Molecule

FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

## Email #4 — 2 days later (designed)
Subject: Your next order, 15% lighter
Preview: SECOND15 ends in 7 days. Free U.S. shipping at $200.

Hero kicker: For your next order
Hero headline: 15% off your second order.
Code chip: SECOND15
Subheadline: Good for 7 days. Free U.S. shipping kicks in at $200 after discounts.
Button: Explore Research Catalog

Dynamic block — "Pairs with what you ordered": 2–3 recommended products (image, name + size, price, Review Specifications button) · Disclaimer line under it.

Section — That's me
Heading: $170 in the cart. $200 for free shipping.
Body: Add something you'll need next month, or pay for shipping now. With 15% off, rounding up to $200 is the easy call.

Section — Why it's easy to reorder (3 rows)
01 — Same-day shipping: order by 1 p.m. CT, Monday to Friday.
02 — Public COA library: check the lot before you pay, every time.
03 — A real reply: questions go to a person on our team.

Offer close
Heading: SECOND15 ends in 7 days.
Body: 15% off your second order. Free U.S. shipping at $200.
Button: Explore Research Catalog
