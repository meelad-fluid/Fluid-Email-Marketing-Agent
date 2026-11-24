# Meta Molecule — Site Abandonment flow copy (2 emails)

Status: draft · needs client approval · goes live once the automation is built in Customer.io

**Talking to:** the independent lab buyer, who is comparing suppliers and has been burned by vanishing documentation when a vendor's COA page they bookmarked last month now returns a 404 (Email #1), and who checks the clock at 12:40 p.m. wondering if an order will still go out today (Email #2).

From: Meta Molecule · Reply-to: support@metamolecule.com (to confirm)

Trigger (Customer.io): page view with no product_viewed, added_to_cart or checkout_started in the session · Exit: product_viewed, checkout_started, placed_order · Not in Browse Abandonment or Abandoned Checkout · Re-entry: 7 days · No new discount. Optional conditional line (only if the person holds an unused WELCOME10): "Your WELCOME10 code still takes 10% off your first order."

## NOTES
**Compliance gate: PASS — READY FOR HUMAN REVIEW** (classification cleared by the Fluid team in Slack, 2026-11-19).
- Tests 1–4, 7: no human benefit, medical, use or dosing language; products by catalog name and size only; imagery = real site product photos, lab equipment, document graphics. PASS.
- Test 5: only verified facts (COA library is public at /coas; same-day shipping before 1 p.m. CT Mon–Fri; free U.S. shipping at $200 after discounts; U.S.-only; prices from /shop 2026-11-19). Not used: per-batch HPLC/MS, ≥99%, lab name, "50,000+". PASS.
- Test 8: default disclaimer until the brand approves its own. Test 9: no offer in this flow. PASS.
- CTAs: View COA Library, Explore Research Catalog, Review Specifications, Contact Support (Title Case).
- Disclaimer line (body + footer): FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

---

## Email #1 — 2 hours after the visit
Subject: Still comparing suppliers?
Preview: Check our documentation first. That's what it's there for.

Hero kicker: Still comparing suppliers?
Hero headline: The COA page you bookmarked is a 404 now.
Subheadline: Ours is public, open to anyone, and it's where we'd start if we were you.
Button: View COA Library

Section — That's me
Heading: You've seen how this goes.
- Bookmarked the COA page. Gone a month later.
- The "report" is a screenshot.
- Your email to support is on day four.
Body: Comparing suppliers shouldn't mean taking their word for it.

Section — What to compare us on (3 numbered proof points)
Heading: Three things to check before you choose
01 — Documentation first: Our COA library is public. Open it before you pay.
02 — Ships today: Order by 1 p.m. CT, Monday to Friday.
03 — Free U.S. shipping: On orders $200+ after discounts.
Button: View COA Library

Section — Ask us
Heading: Got a question? Reply to this email.
Body: A person on our team reads every reply.
Button: Contact Support
Disclaimer line.

## SMS #1 — right after Email #1 (SMS consent only; added 2026-11-24 per Gloria)
Meta Molecule: Still comparing suppliers? Our COA library is public, no login needed: metamolecule.com/coas For research use only. Reply STOP to opt out.

## Email #2 — 1 day later
Subject: What researchers order first
Preview: Three catalog staples. Ordered by 1 p.m. CT, they ship today.

Hero headline: What researchers order first.
Subheadline: Three catalog staples. Order by 1 p.m. CT and it ships today.
Button: Explore Research Catalog

Section — Products (image + name + price + one line + button)
- Tesamorelin 10mg · $60 · Single-compound vial, specifications on the product page · Review Specifications
- MOTS-C 40mg · $119 · Single-compound vial, specifications on the product page · Review Specifications
- BPC157/TB500 Blend 5mg/5mg · $48 · Two-compound blend in one vial · Review Specifications (swapped from CJC/IPA blend 2026-11-19: no site photo for it)
Disclaimer line under products.

Section — Before you order
Heading: Check the documentation first.
Body: Our COA library is public. No login, no request form.
Button: View COA Library

Close
Heading: Order by 1 p.m. CT. It ships today.
Body: Monday to Friday, from the U.S. Free shipping on orders $200+ after discounts.
Button: Explore Research Catalog
