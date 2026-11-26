# Site, browse and cart abandonment: copy
_Client: The Precision Peptide Company · Platform: Customer.io · Written 2026-11-24 · Site + browse rewritten 2026-11-26 to match precisionpeptidecompany.com_
Status: draft · needs approval · goes live once the events from their developer are flowing
From: Sarah from The Precision Peptide Company (proposed persona)

**2026-11-26 (Gloria):** the site sells the nine prescription protocols only (see copy/welcome-flow.md for the list, prices and site lines). Site and browse abandonment no longer mention retail products, the patch, or any code; prescription protocols are never discounted. **Abandoned cart below still has the old retail copy and MYSTERY code and needs the same rewrite before it's designed.**

**Liquid used** (from the event spec)
- `{{event.product_name}}`, `{{event.product_url}}`, `{{event.image_url}}`
- `{{event.checkout_url}}` and the `{% for item in event.items %}` cart table

LEGAL_LINE and TAGLINE: same as the Welcome flow (includes the compounded-medication disclaimer).

---

# Site abandonment (2 emails)

## Email #1: How to tell us apart (2 hours later)
Talking to: the careful first-timer, who's comparing peptide sites that all look the same, when they have three tabs open on their lunch break
Idea: every tab says "premium"; here's what you can actually check.

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
- The licensed US clinician who reviews every intake

SECTION_3_TITLE: The protocol. The prescriber. The pharmacy.
SECTION_3_TEXT: All in one place.
- Choose your protocol from nine, priced up front · BUTTON: View Protocols
- A US-licensed clinician reviews your intake within 24 hours, and a 503A pharmacy fills it · BUTTON: Get Started

CLOSING_LINE: Got a question first? Reply to this email and our team will answer.

## Email #2: Clear pricing (1 day later)
Talking to: the careful first-timer, who left because they couldn't find a price on the last three sites, when they're bracing for a "book a consult to see pricing" page
Idea: the prices, all of them, before a single form.

SUBJECT (pick): Every price, before you fill in a form
SUBJECT (option): What our protocols actually cost
PREVIEW (pick): Protocols from $125 a month
PREVIEW (option): No "book a call to see pricing"

HEADLINE: Most sites make you book a call to see a price. Ours are all right here.
SUBHEADLINE: Clear pricing, fast review, and fulfillment through a regulated pharmacy.
BUTTON: View Protocols

PRODUCTS_TITLE: Where people start
PRODUCT_1: TB-500 · As low as $125/month · Get Started
PRODUCT_2: Semaglutide · As low as $159.67/month · Get Started
PRODUCT_3: NAD+ · From $179/month · Get Started

STEPS_TITLE: Three steps to your protocol
STEP_1: Health assessment
STEP_2: Medical review within 24 hours
STEP_3: Pharmacy fulfillment, discreetly packaged
STEPS_BUTTON: Get Started

---

# Browse abandonment (3 emails + 1 SMS)

## Email #1: Still looking at it? (2 hours later)
Talking to: the careful first-timer, who's been let down by sellers before, when they're reading reviews of one that went dark
Idea: no rush; here's who'd be on the other side of this.

SUBJECT (pick): Still looking at {{event.product_name}}?
SUBJECT (option): You were looking at {{event.product_name}}
PREVIEW (pick): It's still here, and so are we
PREVIEW (option): A few things worth knowing first

HEADLINE: Still thinking about {{event.product_name}}? Take your time, we'll still be here
SUBHEADLINE: Every protocol starts with a private intake and a US-licensed clinician's review within 24 hours.
BUTTON: Get Started (→ {{event.product_url}}#intake)
DYNAMIC_BLOCK: viewed protocol image + name + button (no description)

SECTION_TITLE: Before you decide, here's who you'd be buying from
- Publicly listed: CSE: BPC and OTCQB: PNGAF
- Licensed US clinicians and a 503A pharmacy
- Every batch independently third-party tested

CLOSING_LINE: Questions about {{event.product_name}}? Reply and our team will answer.

## Email #2: Why people switch to us (1 day later)
Talking to: the careful first-timer, who wants a company they can verify, when they're searching a seller's name with "scam"
Idea: the difference you can check, plus the three steps.

SUBJECT (pick): The difference you can actually check
SUBJECT (option): Why people switch to Precision Peptide
PREVIEW (pick): Ticker, clinicians, testing
PREVIEW (option): The protocol, the prescriber, the pharmacy

HEADLINE: Most people who switch to us were tired of buying from sellers they couldn't look up
SUBHEADLINE: Every prescription is written by a licensed US clinician and filled by a 503A pharmacy.
BUTTON: Get Started
DYNAMIC_BLOCK: viewed protocol image + name + button

PROOF_TITLE: What you can verify about us
PROOF_1: Publicly listed on the CSE and OTCQB
PROOF_2: LegitScript seal on our site
PROOF_3: Every batch independently third-party tested

STEPS_TITLE: Three steps to your protocol
STEP_1: Health assessment · STEP_2: Medical review · STEP_3: Pharmacy fulfillment
STEPS_BUTTON: Get Started

## SMS #1 (right after Email #2, consent only)
Precision Peptide: still looking at {{event.product_name}}? A licensed clinician reviews your intake within 24 hours: {{event.product_url}}

## Email #3: Is it right for you? (1 day later)
Talking to: the careful first-timer, who isn't sure the protocol they viewed is the right one, when they're putting it off until they've "read a bit more"
Idea: you don't have to work it out alone; that's the clinician's job, and it takes 24 hours.

SUBJECT (pick): Not sure {{event.product_name}} is right for you?
SUBJECT (option): That's what the clinician review is for
PREVIEW (pick): A licensed clinician answers that within 24 hours
PREVIEW (option): The intake takes a few minutes

HEADLINE: Not sure {{event.product_name}} is right for you? That's what the clinician is for.
BIG_NUMBER: 24 hours
SUBHEADLINE: Fill in the private intake and a US-licensed clinician reviews it within 24 hours. If {{event.product_name}} isn't the right fit, they'll tell you.
BUTTON: Get Started
DYNAMIC_BLOCK: viewed protocol image + name + button

CLOSE_TITLE: Rather talk it through first?
CLOSE_TEXT: Our team answers every message.
CLOSE_BUTTON: Talk to Us (→ /contact)

NOTES (browse + site)
- Guardrails: checked. No outcomes, no dosing or format, no discounts; viewed protocol shown by name only.

---

# Abandoned checkout (4 emails + 2 SMS)
_Rewritten 2026-11-26 (Gloria: "work on the abandoned checkout flow"). Prescription protocols only, no discount anywhere (protocols are never discounted), so the mystery-code emails became a doorstep email and a "what stopped you?" email._
Status: draft · needs approval · goes live once `checkout_started` is flowing from their developer

**Trigger:** `checkout_started` (fires when checkout or the intake starts). **Filter:** no `order_created` since starting the flow. **Re-entry:** after 1 day. Exits Browse and Site Abandonment (cart wins).
**Merge tags:** none in copy, subjects, previews or SMS (Gloria, 2026-11-26: general language only). The only tag is the button link `{{event.checkout_url}}` (reopens the same checkout). Checkout block is static: real vials + "Your protocol" line.
**From:** Sarah from The Precision Peptide Company · LEGAL_LINE + TAGLINE as in the Welcome flow.

## Email #1: Your checkout is saved (30 minutes later)
Talking to: the person halfway through checkout for a protocol on the couch in the evening, who got pulled away by a call or a kid and closed the tab
Idea: a progress bar. They already did the hard part; step one is half done and saved.

SUBJECT (pick): Your checkout is saved
SUBJECT (option): You were almost through
SUBJECT (option): Picking up where you left off?
PREVIEW (pick): Pick it up right where you stopped
PREVIEW (option): Nothing's lost, it's all still there

HEADLINE: You got partway through. We saved your spot.
SUBHEADLINE: Your checkout is right where you left it. Finish it and a US-licensed clinician reviews your intake within 24 hours.
BUTTON: Finish My Checkout
PROGRESS: Checkout started (done) → Clinician review (next) → Pharmacy fulfillment
CHECKOUT_BLOCK: static: example vial + "Your protocol" + "Plus your intake answers so far" + SAVED · BUTTON: Finish My Checkout
CLOSING_LINE: Got stuck on a question in the form? Reply to this email and our team will help.
CLOSING_BUTTON: Finish My Checkout

## SMS #1 (right after Email #1, consent only)
Precision Peptide: your checkout is saved right where you left it. Pick it up here: {{event.checkout_url}}

## Email #2: What happens after you submit (1 day later)
Talking to: the careful first-timer, who stopped at the last step because they weren't sure who reads the form, when they're wondering "will a real doctor actually look at this?"
Idea: the next 24 hours as a timeline, so the unknown after "submit" isn't unknown any more.

SUBJECT (pick): What happens after you hit submit
SUBJECT (option): Who actually reads your intake?
SUBJECT (option): The next 24 hours, step by step
PREVIEW (pick): A licensed clinician, within 24 hours
PREVIEW (option): Here's exactly who sees your answers

HEADLINE: Wondering who reads your intake? A licensed US clinician does.
SUBHEADLINE: Here's what the next 24 hours look like once you finish checking out.
BUTTON: Finish My Checkout

TIMELINE_TITLE: After you submit
- NOW · You finish checkout · Your answers go to a secure, private intake.
- WITHIN 24 HOURS · A clinician reviews it · A US-licensed clinician reads your health history and decides whether the protocol is right for you.
- IF PRESCRIBED · The pharmacy fills it · Your protocol ships from a 503A pharmacy in discreet packaging.
TIMELINE_NOTE: If it isn't the right fit, the clinician will tell you.

CHECKOUT_BLOCK: dynamic (same as Email #1) · BUTTON: Finish My Checkout
HELP_TITLE: Rather ask a person first?
HELP_TEXT: Reply to this email and our team will answer.
HELP_BUTTON: Talk to Us (→ /contact)

## Email #3: What shows up at your door (1 day later)
Talking to: the private buyer, who doesn't want the neighbors or the front desk guessing what's in the box, when they picture it sitting on the doorstep
Idea: a shipping label. The only thing written on the outside is your name.

SUBJECT (pick): What the box looks like
SUBJECT (option): Nobody has to know what's inside
SUBJECT (option): About the delivery
PREVIEW (pick): Plain, discreet, and from a 503A pharmacy
PREVIEW (option): Your checkout is still saved

HEADLINE: The only thing on the box is your name.
SUBHEADLINE: If prescribed, your protocol ships from a 503A pharmacy in plain, discreet packaging.
BUTTON: Finish My Checkout

LABEL_DEVICE: a shipping label: TO: You · FROM: a 503A pharmacy · CONTENTS: your business
SECTION_TITLE: What you can count on
- Discreet packaging, every order
- Filled by a 503A pharmacy, never a gray-market seller
- Prescribed by a US-licensed clinician after review
- A publicly listed company behind it: CSE: BPC and OTCQB: PNGAF

CHECKOUT_BLOCK: dynamic (same as Email #1) · BUTTON: Finish My Checkout

## SMS #2 (right after Email #3, consent only)
Precision Peptide: your checkout is still saved. If prescribed, it ships in plain, discreet packaging: {{event.checkout_url}}

## Email #4: What stopped you? (1 day later)
Talking to: the person who meant to come back and didn't, when they're seeing the fourth email and deciding whether to reply or delete
Idea: no pressure, just ask what stopped them, and let the buttons sort them.

SUBJECT (pick): Can I ask what stopped you?
SUBJECT (option): This is my last note about your checkout
SUBJECT (option): One question, then I'll leave it
PREVIEW (pick): One click tells us, and we'll help
PREVIEW (option): Your checkout is still saved

HEADLINE: This is my last note about it. Can I ask what stopped you?
SUBHEADLINE: Your protocol and intake answers are still saved. Pick whichever reason sounds like you.
CHOICE_1: "I had a question first." · Our FAQ covers prescriptions, side effects and how the review works. · BUTTON: Read the FAQ (→ /faq)
CHOICE_2: "I wasn't sure it was the right protocol." · That's the clinician's call, and they'll tell you if it isn't the right fit. · BUTTON: Compare Protocols (→ /protocols)
CHOICE_3: "I got busy." · Fair enough. Everything you entered is saved. · BUTTON: Finish My Checkout
CHECKOUT_BLOCK: dynamic (same as Email #1)
SIGN_OFF: Or just reply and tell me. I read every one. · Sarah, The Precision Peptide Company

## 2026-11-26 conversion rewrite (Gloria: "copy is vague and not converting, we need people to close")
Designs carry the live copy; these lines supersede the matching lines above.
Facts used (protocol pages + FAQ): reviewed "typically within 24 hours", no insurance required, no labwork to begin, free shipping, supplies + step-by-step instructions included, "If your clinician decides it's not right for you, you will not be charged for the medication", HIPAA-compliant, 503A pharmacy made in the USA.
- #1 HEADLINE: You did the hard part. Let a clinician take it. · SUB: Your answers are saved. Submit them now and a US-licensed clinician typically reviews them within 24 hours. No insurance. No labwork. Free shipping. · PROGRESS: Your answers (saved) → Clinician review (typically 24h) → Ships free (if prescribed) · CARD "What you get": clinician review / 503A pharmacy fill, if prescribed / supplies and step-by-step instructions / free, discreet shipping · TRIO "Nothing to lose by finishing": No insurance / No labwork / Not a fit? Not charged for the medication
- #2 SUB: Submit your saved answers today and they're typically reviewed within 24 hours. If it isn't right for you, you're not charged for the medication. · Timeline: You hit submit / A clinician reviews it (not a fit = not charged) / It ships free · NOTE: The only step left is yours. · HELP: One question holding you up?
- #3 SUB adds ships free + supplies; label adds SHIPPING: Free; count-on list: free discreet shipping / supplies + instructions / 503A, made in the USA / not charged if not a fit · CARD: Submit today and a clinician typically reviews them within 24 hours.
- #4 SUB leads with PROTOCOL15 (15% month one, 72h) · choice answers made concrete; cost choice shows the maths ($199 → $169.15, shipping stays free)
- Suggested subject for #1: "You're one click from a clinician" / preview "Your answers are saved. No insurance needed."

NOTES (abandoned checkout)
- Avatar point: Email #1 the current situation (interrupted), #2 the doubt ("will a real doctor read this?"), #3 privacy at the doorstep, #4 whatever's left, sorted by the reader.
- Frameworks: #1 AIDA (short), #2 PAS, #3 BAB, #4 self-sorting close.
- Subject picks: plain, personal and specific to their checkout; no urgency words since there's no offer or deadline.
- No discounts, no outcomes, no dosing or format. Protocol shown by name and price only. Clinician/24h/503A/discreet/listing facts from the site and compliance.md §5.
- Open: does the checkout URL reopen the same intake? (event spec asks the dev for this)
