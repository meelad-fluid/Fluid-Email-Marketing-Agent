# Site, browse and cart abandonment: copy
_Client: The Precision Peptide Company · Platform: Customer.io · Written 2026-11-24_
Status: draft · needs approval · goes live once the events from their developer are flowing
From: Sarah from The Precision Peptide Company (proposed persona)

**Compliance basis:** approved by Meelad (Fluid), Slack, 2026-11-24. Approved facts only, no outcomes, dosing or effect categories. Viewed or carted products are never described by what they do. Codes apply to the retail range only.

**Liquid used** (from the event spec)
- `{{event.product_name}}`, `{{event.product_url}}`, `{{event.image_url}}`, `{{event.line}}`
- `{{event.checkout_url}}` and the `{% for item in event.items %}` cart table
- Rx vs retail: `{% if event.line == "rx" %} … {% else %} … {% endif %}`

LEGAL_LINE and TAGLINE: same as the Welcome flow.

---

# Site abandonment (2 emails)

## Email #1: Were you checking us out? (2 hours later)
Template: site-abandonment/01-find-your-way
Talking to: the gray-market switcher, who's comparing sites that all look the same, when they have three vendor tabs open on their lunch break

SUBJECT (pick): Comparing peptide companies?
SUBJECT (option): Were you just checking us out?
PREVIEW (pick): Here's the one thing the others can't show you
PREVIEW (option): Our ticker, our clinicians, our pharmacy

HEADLINE: Comparing a few peptide sites that all look the same? Here's how to tell us apart
SUBHEADLINE: We're publicly listed as CSE: BPC and OTCQB: PNGAF, so you can look up exactly who you're buying from.
BUTTON: Explore Protocols

SECTION_1_TITLE: Every tab says "premium" and "tested"
SECTION_1_TEXT: When every site makes the same promises, the only thing that counts is what you can check yourself.

SECTION_2_TITLE: What you can check about us
- Our listing on the CSE and OTCQB
- The LegitScript seal on our site
- The names of our leadership and science team

SECTION_3_TITLE: Two ways in
- The retail range, led by the needle-free Recovery Patch · BUTTON: Shop Now
- Prescription programs reviewed by licensed US clinicians · BUTTON: View Protocols

CLOSING_LINE: Got a question first? Reply to this email and our team will answer.

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Mention WELCOME10 only for people who have it and haven't used it: `{% if customer.popup_answer %}`

## Email #2: Where most people start (1 day later)
Template: site-abandonment/02-best-sellers
Talking to: the needle-averse buyer, who wants the simplest way in, when they're packing the night before a trip

SUBJECT (pick): The one most people start with
SUBJECT (option): Our best seller, in a patch
PREVIEW (pick): No mixing, no measuring, no fridge
PREVIEW (option): Plus our prescription programs

HEADLINE: Packing a cold bag for every trip gets old, which is why most people start with the patch
SUBHEADLINE: The Recovery Patch needs no mixing, no measuring and no refrigeration.
BUTTON: Shop Now

PRODUCTS_TITLE: Our best sellers
PRODUCT_1_NAME: Recovery Patch · BUTTON: Shop Now
PRODUCT_2_NAME: KPV · BUTTON: Shop Now
PRODUCT_3_NAME: BPC · BUTTON: Shop Now

RX_TITLE: Looking for a prescription program instead?
RX_TEXT: Fill in a private intake and a US-licensed clinician reviews it within 24 hours.
RX_BUTTON: Get Started

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- No discount (top of funnel)

---

# Browse abandonment (3 emails + 1 SMS)

## Email #1: Still looking at it? (2 hours later)
Template: browse-abandonment/01-reminder
Talking to: the gray-market switcher, who's been let down by vendors before, when they're reading reviews of a vendor that went dark

SUBJECT (pick): Still looking at {{event.product_name}}?
SUBJECT (option): You were looking at {{event.product_name}}
PREVIEW (pick): It's still here, and so are we
PREVIEW (option): A few things worth knowing first

HEADLINE: Still thinking about {{event.product_name}}? Take your time, we'll still be here
SUBHEADLINE: {% if event.line == "rx" %}Every prescription program starts with a private intake and a US-licensed clinician's review within 24 hours.{% else %}It ships in discreet packaging, and every batch is independently third-party tested.{% endif %}
BUTTON: {% if event.line == "rx" %}Get Started{% else %}Shop Now{% endif %}
DYNAMIC_BLOCK: viewed product image + name + button (no description)

SECTION_TITLE: Before you decide, here's who you'd be buying from
- Publicly listed: CSE: BPC and OTCQB: PNGAF
- Licensed US clinicians and a 503A pharmacy for prescriptions
- Retail products made to cGMP standards

CLOSING_LINE: Questions about {{event.product_name}}? Reply and our team will answer.

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (viewed product shown by name only, never by what it does)

## Email #2: Why people switch to us (1 day later)
Template: browse-abandonment/02-social-proof
Talking to: the gray-market switcher, who wants a company they can verify, when they're searching a vendor's name with "scam"

SUBJECT (pick): The difference you can actually check
SUBJECT (option): Why people switch to Precision Peptide
PREVIEW (pick): Plus 10% off the retail range
PREVIEW (option): Ticker, clinicians, testing

HEADLINE: Most people who switch to us were tired of buying from sellers they couldn't look up
SUBHEADLINE: {% if event.line == "rx" %}Every prescription is written by a licensed US clinician and filled by a 503A pharmacy.{% else %}Here's 10% off the retail range to make the switch easy. Code BROWSE10 works through tomorrow night.{% endif %}
BUTTON: {% if event.line == "rx" %}Get Started{% else %}Shop Now{% endif %}
CODE (retail only): BROWSE10
DYNAMIC_BLOCK: viewed product image + name + button

PROOF_TITLE: What you can verify about us
PROOF_1: Publicly listed on the CSE and OTCQB
PROOF_2: LegitScript seal on our site
PROOF_3: Every batch independently third-party tested

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- No result reviews exist or may be used; proof is company facts
- BROWSE10 must exclude prescription programs

## SMS #1 (right after Email #2, consent only)
Precision Peptide: still looking at {{event.product_name}}? It's here when you're ready: {{event.product_url}}

## Email #3: Your code ends tonight (1 day later)
Template: browse-abandonment/03-incentive
Talking to: the needle-averse buyer, who meant to come back, when they're seeing the vials in the fridge again

SUBJECT (pick): Your 10% ends tonight
SUBJECT (option): Last call on {{event.product_name}}
PREVIEW (pick): BROWSE10, on the whole retail range
PREVIEW (option): Then it's gone

HEADLINE: Your 10% code ends at midnight tonight
SUBHEADLINE: BROWSE10 takes 10% off {{event.product_name}} and everything else in the retail range. Prescription programs aren't included.
BUTTON: Shop Now
CODE: BROWSE10
DYNAMIC_BLOCK: viewed product image + name + button

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Rx viewers: skip this email (branch on `event.line`), since Rx isn't discounted

---

# Abandoned cart (4 emails + 2 SMS)

## Email #1: You left this behind (30 minutes later)
Template: abandoned-checkout/01-reminder
Talking to: the gray-market switcher, who got interrupted mid-checkout, when they're refreshing a tracking page from another vendor

SUBJECT (pick): You left something in your cart
SUBJECT (option): Your cart is saved
PREVIEW (pick): Pick up right where you left off
PREVIEW (option): It's all still there

HEADLINE: Got pulled away at checkout? Your cart is saved right where you left it
SUBHEADLINE: Everything's still there, and it ships in discreet packaging once you finish.
BUTTON: Return to Checkout
DYNAMIC_TABLE: cart items (name, quantity, price)
BUTTON_2: Return to Checkout

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Rx intake abandons (`event.line == "rx"`): BUTTON = "Finish Your Intake", subhead "Your answers are saved, and a US-licensed clinician reviews it within 24 hours of submitting."

## SMS #1 (right after Email #1, consent only)
Precision Peptide: your cart is saved. Finish checking out here: {{event.checkout_url}}

## Email #2: Questions before you check out? (1 day later)
Template: abandoned-checkout/02-reviews (reviews replaced by order facts)
Talking to: the gray-market switcher, who's been burned by a vendor that never shipped, when they're a week into refreshing a tracking page

SUBJECT (pick): Before you check out
SUBJECT (option): A few things people ask at checkout
PREVIEW (pick): Who ships it, how it arrives, who to ask
PREVIEW (option): Your cart is still saved

HEADLINE: If you've ever paid and then waited on a tracking page that never moved, here's what to expect from us
SUBHEADLINE: Your cart is still saved.
BUTTON: Return to Checkout
DYNAMIC_TABLE: cart items

FACTS_TITLE: What happens after you order
FACT_1: Discreet packaging
FACT_2: Prescription orders ship from a licensed 503A pharmacy
FACT_3: A real team answers your emails

HELP_TITLE: Still have a question?
HELP_TEXT: Reply to this email and our team will get back to you before you order.
HELP_BUTTON: Talk to Us

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Add shipping times when the client confirms them (not on the site)

## Email #3: Your mystery discount (1 day later)
Template: abandoned-checkout/03-mystery-discount
Talking to: the needle-averse buyer, who almost ordered the patch, when they're opening the fridge door again

SUBJECT (pick): We left a mystery discount in your cart
SUBJECT (option): Get up to 25% off your cart
PREVIEW (pick): You'll see how much at checkout
PREVIEW (option): Use it before tomorrow night

HEADLINE: Get up to 25% off what's in your cart
SUBHEADLINE: Use code MYSTERY at checkout to see how much you saved. It works on the retail range until tomorrow at midnight.
BUTTON: Reveal My Discount
CODE: MYSTERY
DYNAMIC_TABLE: cart items
EXCLUSION_LINE: Prescription programs aren't included.

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (teaser at the approved 25% ceiling; real value 15%)
- Rx-only carts skip Emails #3 and #4 and SMS #2

## SMS #2 (right after Email #3, consent only)
Precision Peptide: code MYSTERY takes up to 25% off the retail items in your cart, until tomorrow at midnight. {{event.checkout_url}}

## Email #4: Last chance for your mystery discount (1 day later)
Template: abandoned-checkout/04-last-chance
Talking to: the needle-averse buyer, who keeps meaning to finish the order, when they're packing a bag at the end of the day

SUBJECT (pick): Your mystery discount ends at midnight
SUBJECT (option): Last chance on your cart
PREVIEW (pick): Code MYSTERY, then it's gone
PREVIEW (option): Your cart is still saved

HEADLINE: Your mystery discount ends at midnight tonight
SUBHEADLINE: Code MYSTERY still works on the retail items in your cart until then.
BUTTON: Return to Checkout
CODE: MYSTERY
DYNAMIC_TABLE: cart items

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
