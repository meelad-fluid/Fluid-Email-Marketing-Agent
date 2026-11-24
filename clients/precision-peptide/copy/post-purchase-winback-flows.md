# Post-purchase and winback: copy
_Client: The Precision Peptide Company · Platform: Customer.io · Written 2026-11-24_
Status: draft · needs approval · goes live once built in Customer.io
From: Sarah from The Precision Peptide Company (proposed) · plain-text notes from Pratap Sandhu

**Compliance basis:** approved by Meelad (Fluid), Slack, 2026-11-24. No use instructions, dosing, timelines or outcomes in any email. Use questions on prescription orders always go to the prescribing clinician. Winback never infers a need for more. Codes apply to the retail range only.

LEGAL_LINE and TAGLINE: same as the Welcome flow.

---

# Post-purchase (4 emails + 1 SMS)

## Email #1: Thank you (plain text, 5 minutes after the first order)
Template: post-purchase/01-thank-you-plain
Talking to: the gray-market switcher, who's used to paying and hearing nothing, when they've just placed their first order and are waiting for a sign it's real

SUBJECT (pick): Thank you for your first order
SUBJECT (option): A quick thank you from Pratap
PREVIEW (pick): And who to talk to if you need anything
PREVIEW (option): Here's what happens next

GREETING: Hi {{customer.first_name | default: "there"}},
PARAGRAPH_1: Thank you for your first order with The Precision Peptide Company. I know trusting a new company with something like this is a real decision, and I don't take it lightly.
PARAGRAPH_2: Your order confirmation and tracking will come in separate emails. Everything ships in discreet packaging, and if it's a prescription order, it comes from our licensed 503A pharmacy partner.
PARAGRAPH_3: If anything about your order isn't right, or you just have a question, reply to this email. Our team reads every reply, and you'll hear back from a real person.
SIGN_OFF: Pratap Sandhu, CEO, The Precision Peptide Company

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Doesn't repeat the order confirmation (sent by their platform)
- Needs Pratap's OK to send under his name

## SMS #1 (right after Email #1, consent only)
Precision Peptide: thanks for your order. Tracking is on its way by email. Questions? Just reply to our email and our team will help.

## Email #2: What's in the box (1 day later)
Template: post-purchase/02-get-ready
Talking to: the needle-averse buyer, who wants it to be simple, when they're opening a flat patch pack for the first time

SUBJECT (pick): What to expect when your order arrives
SUBJECT (option): Your order is on its way
PREVIEW (pick): And where to send any question
PREVIEW (option): Plus 15% off your next retail order

HEADLINE: When your package lands, here's everything you need to know about what's inside
SUBHEADLINE: It arrives in plain, discreet packaging, and every batch is independently third-party tested.
BUTTON: Talk to Us

SECTION_1_TITLE: If you ordered from the retail range
SECTION_1_TEXT: Follow the directions on the label. The Recovery Patch needs no mixing, no measuring and no refrigeration, so it can go straight into a drawer or your bag.

SECTION_2_TITLE: If you ordered a prescription program
SECTION_2_TEXT: Your prescribing clinician is the right person for every question about your prescription. You can reach them through your account.
SECTION_2_BUTTON: Login

SECTION_3_TITLE: Anything else
SECTION_3_TEXT: Questions about shipping, your order or our company go to our team. Reply to this email and we'll answer.

OFFER_TITLE: For your next retail order
OFFER_TEXT: Code THANKYOU15 takes 15% off the retail range for the next 14 days. Prescription programs aren't included.
OFFER_BUTTON: Shop Now
CODE: THANKYOU15

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (no use instructions; points to the label and the clinician)
- Confirm clinicians are reachable through the account login; if not, give the support route the client uses
- Code name THANKYOU15 is a proposal

## Email #3: How did it go? (plain text, 7 days later)
Template: post-purchase/03-check-in-plain
Talking to: the gray-market switcher, who's used to vendors that disappear after the sale, when their first order has arrived and they're deciding if we were worth it

SUBJECT (pick): Did everything arrive okay?
SUBJECT (option): Quick question about your order
PREVIEW (pick): A real person reads the replies
PREVIEW (option): Two minutes, if you have them

GREETING: Hi {{customer.first_name | default: "there"}},
PARAGRAPH_1: Your order should have reached you by now, and I wanted to check that everything turned up the way it should have.
PARAGRAPH_2: Did it arrive on time, was the packaging discreet, and was anything unclear? If something wasn't right, reply and tell me. We'd much rather fix it than have you wonder.
PARAGRAPH_3: And if the ordering and delivery went well, a short review of our service would help other people who are trying to find a company they can trust.
TEXT_LINK: Leave a review: [review link needed from the client]
SIGN_OFF: Pratap Sandhu, CEO, The Precision Peptide Company

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (asks for a service review only, never personal results)
- Needs the client's review link; drop the third paragraph until they have one

## Email #4: Picked for you (2 days later)
Template: post-purchase/04-complete-the-kit
Talking to: the needle-averse buyer, who liked how simple the first order was, when they're unpacking their bag after a trip

SUBJECT (pick): Your 15% code ends soon
SUBJECT (option): The rest of our retail range
PREVIEW (pick): A few days left on THANKYOU15
PREVIEW (option): All of it needle-free and third-party tested

HEADLINE: If your first order was easy, the rest of the range works the same way
SUBHEADLINE: Code THANKYOU15 takes 15% off the retail range for a few more days.
BUTTON: Shop Now
CODE: THANKYOU15

PRODUCTS_TITLE: The retail range
PRODUCT_1_NAME: Recovery Patch · BUTTON: Shop Now
PRODUCT_2_NAME: KPV · BUTTON: Shop Now
PRODUCT_3_NAME: BPC · BUTTON: Shop Now

EXCLUSION_LINE: Prescription programs aren't included.

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (no pairing logic tied to use; products by name only)
- Swap in real "bought X, then Y" pairs once order data exists

---

# Winback (2 emails + 1 SMS)

## Email #1: What's new since your last order (90 days after a first order, no reorder)
Template: winback/01b-check-in-designed
Talking to: the gray-market switcher, who drifted back to comparing vendors, when they have three vendor tabs open again

SUBJECT (pick): A few things have changed since your last order
SUBJECT (option): What's new at Precision Peptide
PREVIEW (pick): Plus 20% off the retail range
PREVIEW (option): And an easy way to tell us what went wrong

HEADLINE: It's been a while, so here's what's new at Precision Peptide since you last ordered
SUBHEADLINE: Code COMEBACK20 takes 20% off the retail range for the next 7 days.
BUTTON: Shop Now
CODE: COMEBACK20

NEW_TITLE: New since your last visit
NEW_TEXT: [client to confirm: new products, formats or restocks at send time]

TRUST_TITLE: Still the same company you can look up
- Publicly listed: CSE: BPC and OTCQB: PNGAF
- Licensed US clinicians and a 503A pharmacy
- Every batch independently third-party tested

FEEDBACK_TITLE: Did something go wrong?
FEEDBACK_TEXT: If your first order didn't go the way it should have, reply and tell us. Our team reads every reply.

EXCLUSION_LINE: Prescription programs aren't included.

NOTES
- Compliance gate: HOLD — VERIFICATION REQUIRED until the "new since" block is filled with confirmed launches (the Thymosin Alpha-1 and tirzepatide patches are not on sale yet, so they can't be named as available)
- Never "running low", "next round" or anything that implies use

## SMS #1 (right after Email #1, consent only)
Precision Peptide: it's been a while. Code COMEBACK20 takes 20% off our retail range for 7 days: https://www.precisionpeptidecompany.com

## Email #2: Your code ends soon (5 days later)
Template: winback/02-come-back-offer
Talking to: the needle-averse buyer, who meant to come back, when they're seeing the vials in the fridge again

SUBJECT (pick): Your 20% ends in two days
SUBJECT (option): Last few days for COMEBACK20
PREVIEW (pick): On the whole retail range
PREVIEW (option): Then it's gone

HEADLINE: Your 20% code ends in two days
SUBHEADLINE: COMEBACK20 takes 20% off anything in the retail range, including the needle-free Recovery Patch.
BUTTON: Shop Now
CODE: COMEBACK20

PRODUCTS_TITLE: Our best sellers
PRODUCT_1_NAME: Recovery Patch · BUTTON: Shop Now
PRODUCT_2_NAME: KPV · BUTTON: Shop Now
PRODUCT_3_NAME: BPC · BUTTON: Shop Now

EXCLUSION_LINE: Prescription programs aren't included.

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Rx-only customers: skip the code and send a "what's new" note without an offer
