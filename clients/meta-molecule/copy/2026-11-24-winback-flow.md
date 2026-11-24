# Meta Molecule — Winback flow copy (2 emails + 1 SMS)

Status: draft · needs client approval · goes live once the automation is built in Customer.io

**Talking to:** the independent lab buyer who ordered with us a while back and has since gone back to a vendor's COA page they bookmarked, only to find a 404 ("Their COA page just disappeared.") (Email #1), and the lab buyer building next quarter's order list on a spreadsheet, asking "What do I put in one order?" (Email #2).

From: Meta Molecule (both designed) · Reply-to: support@metamolecule.com (to confirm)

Trigger (Customer.io): `placed_order` (any order, first or repeat: the flow goes to every buyer, per Gloria 2026-11-24) · Delay 90 days · Flow filter: exits on any later `placed_order` (they re-enter from that order) · Re-entry: yes, from each new order. 90 days is an estimate: set it from the real time between orders once order data is in.
Dynamic block (both emails): items from their most recent order (image, catalog name + size, current price, Review Specifications). Exclude held products and out-of-stock items; fallback = MOTS-C 40mg, BPC157/TB500 Blend 5mg/5mg, Tesamorelin 10mg. Designs show the fallback as the sample.

## NOTES
**Compliance gate: PASS — READY FOR HUMAN REVIEW** (classification cleared by the Fluid team in Slack, 2026-11-19).
- Tests 1–4, 7: no human benefit, medical, use or dosing language. Nothing implies they've run out or need more for use (no "running low", no "time to restock"): the hook is documentation and the offer. Products by catalog name and size; imagery = real site product photos, lab equipment, documents. PASS.
- Test 5: only verified facts (public COA library at /coas; same-day shipping before 1 p.m. CT Mon–Fri; free U.S. shipping at $200 after discounts; catalog bundles priced below single vials). The strategy's "new lots and new COAs since you ordered" hook is dropped: we can't verify new lots or new COAs (library shows one COA). We never say their lot's COA is published. PASS.
- Test 8: default disclaimer until the brand approves its own. Test 9: COMEBACK20 (20% off, under the 25% max; expires 5 days after Email #2) and the SMS disclosure are proposals; a person at Fluid approves before live. Whether COMEBACK20 stacks with bundle pricing: client to confirm (copy doesn't say it does).
- CTAs: Explore Research Catalog, Review Specifications, View COA Library, Contact Support (Title Case).
- Disclaimer line (body + footer): FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.

---

## Email #1 — 90 days after their last order
Subject: Been a while. Here's 20% off.
Preview: Our COA library is still public, still at the same link. Use COMEBACK20.

Hero kicker: It's been a while
Hero headline: Been a while. Here's 20% off.
Code chip: COMEBACK20
Subheadline: Our COA library is still public and still at the same link. Use the code on your next order.
Button: Explore Research Catalog

(Dynamic "From your last order" block removed 2026-11-24 per Gloria. Disclaimer line sits under the hero.)

Section — That's me
Heading: Ever gone back to a vendor's COA page and hit a 404?
Body: The bookmark's dead. The PDF you meant to save is gone. Ours lives at metamolecule.com/coas: public, no login, no request form.
Button: View COA Library

Section — What hasn't changed (3 rows)
01 — Ships today: order by 1 p.m. CT, Monday to Friday.
02 — Public COA library: check before you pay.
03 — Free U.S. shipping: on orders $200+ after discounts.

Section — Something off last time?
Heading: If your last order wasn't right, tell us.
Body: Reply to this email. A person on our team reads every one.
Button: Contact Support

Offer close
COMEBACK20 · 20% off your next order
Button: Explore Research Catalog

## SMS #1 — right after Email #1 (SMS consent only)
Meta Molecule: It's been a while. 20% off your next order with COMEBACK20: metamolecule.com/shop For research use only. Reply STOP to opt out.

## Email #2 — 5 days later
Subject: Your 20% code expires soon
Preview: COMEBACK20 ends in 5 days. Plan the next order in one go.

Hero kicker: Last call on COMEBACK20
Hero headline: 20% off ends in 5 days.
Code chip: COMEBACK20
Subheadline: One order, 20% off, and free U.S. shipping at $200 after discounts.
Button: Explore Research Catalog

(Dynamic "Pick up where you left off" block removed 2026-11-24 per Gloria. Disclaimer line sits above the "That's me" card.)

Section — That's me
Heading: Building next quarter's order list?
Body: One spreadsheet, five vendors, five shipping fees. Put it in one order here and check every COA in one place before you pay.

Section — Ordering several?
Heading: Bundles are priced below buying each vial alone.
Body: Browse the bundles in our catalog.
Button: Explore Research Catalog

Offer close
Heading: COMEBACK20 ends in 5 days.
Body: 20% off your next order.
Button: Explore Research Catalog
