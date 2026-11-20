# Meta Molecule — Browse Abandonment flow copy (3 emails + 1 SMS)

Status: draft · needs client approval · goes live once the automation is built in Customer.io

**Talking to:** the independent lab buyer, who is comparing one compound across three vendor tabs and none of the COAs show a lot number (Email #1), who can't tell who tested a vendor's material when they're zooming into a blurry COA screenshot with no lab name (Email #2), and who has closed two of the three tabs when the code they were holding is about to run out (Email #3).

From: Meta Molecule · Reply-to: support@metamolecule.com (to confirm)

Trigger (Customer.io): `product_viewed` · Exit: `added_to_cart`, `checkout_started`, `placed_order` · Not in Abandoned Checkout · Re-entry: 7 days · Conversion goal: `placed_order` within 5 days.
Dynamic block (every email, right under the hero): the viewed product's image, catalog name + size, current price, link to its product page. Render only if in stock. If the event has no product data, show the three starting products (MOTS-C 40mg, BPC157/TB500 Blend 5mg/5mg, Tesamorelin 10mg). Designs show MOTS-C 40mg as the sample. Never show held products (Reta, Tirz, GLOW, CEO in a Bottle, strips, capsules, Amino H2O): if one of those is viewed, suppress the flow.

## NOTES
**Compliance gate: PASS — READY FOR HUMAN REVIEW** (classification cleared by the Fluid team in Slack, 2026-11-19).
- Tests 1–4, 7: no human benefit, medical, use or dosing language; products by catalog name and size only; imagery = real site product photos, lab equipment, document graphics. PASS.
- Test 5: only verified facts (COA library is public at /coas; same-day shipping before 1 p.m. CT Mon–Fri; free U.S. shipping at $200 after discounts; no returns once shipped, damaged/incorrect items go to support). We never say a specific product's lot COA is published (per-batch coverage is HOLD): links say "Review Specifications" (product page) and "View COA Library". The Email #2 checklist is general education on reading any COA. PASS.
- Test 8: default disclaimer until the brand approves its own. Test 9: BROWSE10 (10%, expires 11:59 p.m. CT the day Email #3 sends) and the SMS disclosure are proposals; a person at Fluid approves before live.
- Optional (Email #2, build-time): if the viewed product is in a catalog bundle, add one line under the block: "Also in the [bundle name], $[price]." Not designed.
- CTAs: Review Specifications, View COA Library, Contact Support (Title Case).
- Disclaimer line (body + footer): FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

---

## Email #1 — 2 hours after the product view
Subject: Still comparing {{ event.product_name }}?
Preview: Three tabs, three prices. Only one lets you check first.

Hero kicker: Still comparing?
Hero headline: Same compound. Three tabs. One you can check.
Subheadline: What you looked at is still in the catalog, same price. Our COA library is public before you pay.
Button: Review Specifications

Dynamic block: viewed product (image, name + size, price) · Button: Review Specifications · Disclaimer line under it.

Section — That's me
Heading: Three tabs, zero lot numbers.
- Tab 1: the cheapest. The COA is a screenshot.
- Tab 2: "COA available on request."
- Tab 3: "Ships in 1–3 business days."
Body: You shouldn't have to pick on price and hope.

Section — Why compare it here (3 rows)
01 — Documentation first: Our COA library is public. No login, no request form.
02 — Ships today: Order by 1 p.m. CT, Monday to Friday.
03 — Free U.S. shipping: On orders $200+ after discounts.
Button: View COA Library

Section — Ask us
Heading: Comparing specs? Reply to this email.
Body: A person on our team reads every reply.
Button: Contact Support

## Email #2 — 1 day later
Subject: Check the COA before you decide
Preview: Four things to look for on any report. Plus 10% off with BROWSE10.

Hero kicker: Before you decide
Hero headline: Check the COA. Then take 10% off.
Big offer: 10% OFF · Code chip: BROWSE10
Subheadline: Use BROWSE10 on what you were looking at. It expires at 11:59 p.m. CT tomorrow.
Button: Review Specifications

Dynamic block: viewed product (image, name + size, price) · Button: Review Specifications · Disclaimer line under it.

Section — That's me
Heading: A blurry screenshot isn't a report.
Body: No lab name. No date. No lot number you can match to a vial. If you can't read it, you can't check it.

Section — The checklist (4 numbered steps)
Heading: Four things to look for on any COA
01 — The lot number: it should match the label on the vial.
02 — The lab: the report names who ran the test.
03 — The date: you can see when it was tested.
04 — The report ID: something you can file and find again.
Body: Our COA library is public. Open it and run the checklist yourself.
Button: View COA Library

Section — Before you order
- Free U.S. shipping on orders $200+ after discounts.
- No returns once shipped, so we say it up front.
- Damaged or incorrect item? Contact support with your order number.
Button: Contact Support

Offer card
BROWSE10 · 10% off · expires 11:59 p.m. CT tomorrow
Button: Review Specifications

## SMS #1 — right after Email #2
Meta Molecule: Still looking at {{ event.product_name }}? Specs are on the product page, and our COA library is public: metamolecule.com/coas For research use only. Reply STOP to opt out.

## Email #3 — 1 day later
Subject: Your 10% code expires tonight
Preview: BROWSE10 ends at 11:59 p.m. CT. Order by 1 p.m. CT and it ships today.

Hero kicker: Last day
Hero headline: Your 10% ends tonight.
Big offer: 10% OFF · Code chip: BROWSE10
Subheadline: Use it on what you were looking at before 11:59 p.m. CT.
Button: Review Specifications

Dynamic block: viewed product (image, name + size, price) · Button: Review Specifications · Disclaimer line under it.

Section — Ships today
Heading: Order by 1 p.m. CT. It ships today.
Body: Monday to Friday, from the U.S. Free shipping on orders $200+ after discounts.

Expiry banner
Heading: BROWSE10 · 10% off · ends 11:59 p.m. CT tonight
Button: Review Specifications
