# Welcome flow: copy (pop-up + 7 emails + 2 SMS)
_Client: The Precision Peptide Company · Platform: Customer.io · Written 2026-11-24 · Rewritten 2026-11-26 to match precisionpeptidecompany.com_
Status: draft · needs approval · goes live once built in Customer.io
From: Sarah from The Precision Peptide Company (proposed persona) · founder note from Pratap Sandhu

**What changed (2026-11-26, Gloria):** the website sells prescription protocols only. Every retail product (Recovery Patch, KPV, BPC capsules), the "retail range", the needle-free angle and the WELCOME10 / WELCOME15 codes are gone. Products are the nine protocols on /protocols, with the site's prices, names, CTAs and messaging. No discounts (prescription protocols are never discounted).

**Offer added (2026-11-26, Gloria): 15% off.** Overrides "no discounts" above. Needs the client/counsel OK (counsel's approval was no discounts on prescription protocols) and the codes created on their site before anything sends.
- Pop-up + Welcome: WELCOME15 · 15% off the first month of any protocol · one use per customer · valid 14 days after sign-up · prescription still required after clinician review
- Pop-up Step 1 SUB: Tell us and get 15% off your first month, plus the plain-English version: how it works, what it costs and who reviews it.
- Pop-up Step 4 SUB: Here's 15% off your first month of any protocol. It's in your inbox too. · CODE: WELCOME15 · TERMS: One use per customer, valid for 14 days. A prescription is still required after clinician review.
- Email #1 (all versions): kicker "Welcome · 15% off your first month", 15% badge, coupon under the hero (v2 maths: Semaglutide $159.67 → $135.72; v3: TB-500 $125 → $106.25; v4: NAD+ $179 → $152.15)
- Email #5 now the 15% reminder: HEADLINE "Your welcome code still takes" · "15%" · "off your first month" · "Enter WELCOME15 at checkout, on any protocol. It ends 14 days after you signed up." · BUTTON "Use My 15%" · first-month prices TB-500 $106.25, BPC-157 $118.15, Semaglutide $135.72, NAD+ $152.15 · banner "Code: WELCOME15 / Start your intake before your 15% ends..."
- SMS #2: Precision Peptide: your 15% off your first month ends soon. Use WELCOME15 on any protocol, prescription still required: https://www.precisionpeptidecompany.com/protocols
- Elsewhere: Browse #3 + Checkout #4 use PROTOCOL15 (15% off first month, 72 hours); Winback #2 uses COMEBACK15 (15% off next month, 7 days).

**Products (from /protocols, prices verbatim)**
- Semaglutide · As low as $159.67/month · /protocols/semaglutide
- Tirzepatide · As low as $233/month · /protocols/tirzepatide
- Sermorelin · From $199/month · /protocols/sermorelin
- BPC-157 · From $139/month · /protocols/bpc-157
- TB-500 · As low as $125/month · /protocols/tb-500
- NAD+ · From $179/month · /protocols/nad-plus
- Epitalon · From $199/month · /protocols/epitalon
- MOTS-c · From $199/month · /protocols/mots-c
- Semax · From $249/month · /protocols/semax
- Each "Get Started" goes to /protocols/<handle>#intake. Site groups: Weight Loss (Semaglutide, Tirzepatide), Performance (Sermorelin, BPC-157, TB-500), Longevity (NAD+, Epitalon, MOTS-c, Semax): used only as small group labels, never in subjects or headlines, and never with an outcome.

**Site lines used:** "Precision medicine, prescribed by licensed US clinicians." · "The protocol. The prescriber. The pharmacy. All in one place." · "Three steps to your protocol" · "Clear pricing, fast review, and fulfillment through a regulated pharmacy." · "Choose your protocol" · "never one-size-fits-all" · MMA.INC partnership
**Not used, on purpose:** the site's outcome lines ("Lose weight, support cellular energy, and stay sharp", "Feel the Difference") and "FDA-regulated/FDA-registered pharmacy" (counsel rules: no outcomes, no FDA wording near the product).

**Legal line (every email)**
LEGAL_LINE: The Precision Peptide Company · CSE: BPC | OTCQB: PNGAF · [business address needed] · Content on this site is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Individual results may vary. Prescription products may not be appropriate for all individuals. The products and services offered by The Precision Peptide Company require a prescription issued by a licensed US clinician following a clinical review. Compounded medications are not FDA-approved and have not been evaluated by the FDA for safety, effectiveness or quality. A prescription is required and all treatment is subject to clinician review. · Unsubscribe · Manage preferences

TAGLINE: Done properly. Done legally. Done once.

---

## Pop-up

**Step 1**
- HEADLINE: Which protocol brought you here?
- SUB: Tell us and we'll send the plain-English version: how it works, what it costs and who reviews it.
- ANSWER 1: Semaglutide or Tirzepatide (`weight_loss`)
- ANSWER 2: Sermorelin, BPC-157 or TB-500 (`performance`)
- ANSWER 3: NAD+, Epitalon, MOTS-c or Semax (`longevity`)
- ANSWER 4: Not sure yet (`not_sure`)

**Step 2**
- HEADLINE: Where should we send it?
- FIELD: Email
- BUTTON: Continue
- TRUST LINE: Publicly listed on the CSE (BPC) and OTCQB (PNGAF).

**Step 3**
- HEADLINE: Want updates by text too?
- SUB: We only text about your protocol, your orders and anything new, a few times a month.
- FIELD: Phone number
- BUTTON: Yes, Text Me
- SECONDARY: No thanks, email is fine
- CONSENT: By submitting you agree to receive recurring automated marketing texts from The Precision Peptide Company. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to cancel.

**Step 4**
- HEADLINE: You're in.
- SUB: Your first email is on its way. Want to start now? The intake takes a few minutes.
- BUTTON: Get Started

---

## Email #1 v1 (answered `not_sure`, or no answer)
Talking to: the careful first-timer, who has read about peptides for months but can't tell which sites are real, when they're comparing three tabs that all promise the same thing
Idea: "The protocol. The prescriber. The pharmacy." Three things in one place, and you can check every one of them.

SUBJECT (pick): The protocol, the prescriber and the pharmacy
SUBJECT (option): Welcome to The Precision Peptide Company
PREVIEW (pick): All in one place, and all on the record
PREVIEW (option): Here's how it works, start to finish

HEADLINE: Most peptide sites sell you a vial. We start with a licensed clinician.
SUBHEADLINE: Precision medicine, prescribed by licensed US clinicians. The protocol, the prescriber and the pharmacy, all in one place.
BUTTON: Get Started

STORY_TITLE: Three steps to your protocol
STEP_1: Health assessment · A secure, private intake covering your goals, health history and eligibility.
STEP_2: Medical review · A US-licensed clinician reviews your intake within 24 hours.
STEP_3: Pharmacy fulfillment · If prescribed, your protocol ships from a 503A pharmacy, discreetly packaged.
STORY_CLOSING_LINE: Protocols are tailored by a licensed clinician, never one-size-fits-all, and some won't be right for everyone.

FAQ_TITLE: Not sure which protocol fits?
FAQ_TEXT: That's what the eligibility check is for. A licensed clinician recommends a protocol based on your goals and health history.
FAQ_BUTTON: Read Our FAQ

PRODUCTS_TITLE: The full peptide portfolio
PRODUCT_1: Semaglutide · As low as $159.67/month · View Protocol
PRODUCT_2: Sermorelin · From $199/month · View Protocol
PRODUCT_3: NAD+ · From $179/month · View Protocol
ALL_BUTTON: View All Protocols

USP_1: Licensed US clinicians
USP_2: 503A pharmacy
USP_3: Third-party tested
USP_4: HIPAA-compliant

## Email #1 v2 (answered `weight_loss`)
Talking to: the person who's priced semaglutide and tirzepatide on five sites, when they're trying to work out which of those sites has a real clinician behind it
Idea: clear pricing, side by side, with the clinician and the pharmacy named.

SUBJECT (pick): Semaglutide and Tirzepatide, priced up front
SUBJECT (option): Here's how our GLP-1 protocols work
PREVIEW (pick): And a licensed clinician behind every prescription
PREVIEW (option): Review within 24 hours

HEADLINE: Semaglutide or Tirzepatide? Here's what each costs, and who reviews it
SUBHEADLINE: Both are compounded, prescribed only after a US-licensed clinician reviews your intake, and filled by a 503A pharmacy.
BUTTON: Get Started

PRODUCTS_TITLE: Your two options
PRODUCT_1: Semaglutide · As low as $159.67/month · Compounded semaglutide, prescribed after clinician review. · Get Started
PRODUCT_2: Tirzepatide · As low as $233/month · Compounded tirzepatide, prescribed after clinician review. · Get Started

STORY_TITLE: Three steps to your protocol
STEP_1 to STEP_3: as v1
STORY_CLOSING_LINE: Your clinician decides which one, if either, is right for you.

FAQ_TITLE / FAQ_TEXT / FAQ_BUTTON: as v1
USP_1-4: as v1

## Email #1 v3 (answered `performance`)
Talking to: the person who trains hard and has read every forum thread on BPC-157 and TB-500, when they're realising none of those sellers will put a name to what they ship
Idea: the same peptides they've read about, with a prescriber and a pharmacy attached.

SUBJECT (pick): Sermorelin, BPC-157 and TB-500, prescribed properly
SUBJECT (option): Here's how our protocols work
PREVIEW (pick): A licensed clinician and a 503A pharmacy behind each one
PREVIEW (option): From $125 a month

HEADLINE: You've read the threads on BPC-157 and TB-500. Here's the version with a prescriber.
SUBHEADLINE: Each protocol is prescribed by a US-licensed clinician after a private intake, and filled by a 503A pharmacy.
BUTTON: Get Started

PRODUCTS_TITLE: Three protocols
PRODUCT_1: Sermorelin · From $199/month · Get Started
PRODUCT_2: BPC-157 · From $139/month · Get Started
PRODUCT_3: TB-500 · As low as $125/month · Get Started

PARTNER_TITLE: The first peptide brand inside MMA.INC
PARTNER_TEXT: We're the exclusive peptide partner inside MMA.INC's combat sports ecosystem.

STORY_TITLE / STEPS / FAQ / USPs: as v1
STORY_CLOSING_LINE: Protocols are tailored by a licensed clinician, never one-size-fits-all.

## Email #1 v4 (answered `longevity`)
Talking to: the planner who reads the research on NAD+ and MOTS-c, when they want a clinician, not a forum, deciding what's right for them
Idea: four protocols, one clinician conversation.

SUBJECT (pick): NAD+, Epitalon, MOTS-c and Semax
SUBJECT (option): Here's how our protocols work
PREVIEW (pick): Four protocols, one licensed clinician
PREVIEW (option): Review within 24 hours

HEADLINE: Four protocols you've read about. One licensed clinician to decide which fits.
SUBHEADLINE: Each one is prescribed only after a US-licensed clinician reviews your intake, and filled by a 503A pharmacy.
BUTTON: Get Started

PRODUCTS_TITLE: Four protocols
PRODUCT_1: NAD+ · From $179/month · Get Started
PRODUCT_2: Epitalon · From $199/month · Get Started
PRODUCT_3: MOTS-c · From $199/month · Get Started
PRODUCT_4: Semax · From $249/month · Get Started

STORY_TITLE / STEPS / FAQ / USPs: as v1
STORY_CLOSING_LINE: Some protocols, like Epitalon, are prescribed in set courses after clinician review.

NOTES (all v1-v4)
- Prices and product names verbatim from /protocols (2026-11-26). Group labels never in subject/headline. No outcomes, no dosing or format.
- Guardrails: checked (no outcomes, no FDA wording, compounded disclaimer in footer)

---

## SMS #1 (right after Email #1, consent only)
Precision Peptide: welcome in. Every protocol starts with a private intake and a US-licensed clinician's review within 24 hours. Start here: https://www.precisionpeptidecompany.com/protocols

---

## Email #2: A note from Pratap (plain text, 4 hours later)
Talking to: the careful first-timer, who's been burned by a seller that vanished, when they're emailing a vendor for the third time with no reply
Idea: why we chose the harder, public way.

SUBJECT (pick): Why we listed the company publicly
SUBJECT (option): A quick note from our CEO
PREVIEW (pick): It wasn't the easy way to do it
PREVIEW (option): And why you can always reach us

GREETING: Hi there,
PARAGRAPH_1: I'm Pratap, the CEO of The Precision Peptide Company. I wanted to write to you myself, because the reason this company exists is pretty simple.
PARAGRAPH_2: Too many people buy peptides from sellers they can't look up, can't call and can't hold to anything. We went the other way. We listed the company publicly, so our filings are open to anyone, and every protocol we offer runs through a licensed US clinician and a 503A pharmacy.
PARAGRAPH_3: Our line for it is "done properly, done legally, done once." It's slower and it costs more to run a company this way, and we think that's exactly the point.
OFFER_LINE: When you're ready, the intake takes a few minutes and a clinician reviews it within 24 hours.
REPLY_INVITE: If anything about us isn't clear, just reply to this email. It comes to our team, and real people answer it.
TEXT_LINK: Read who we are: https://www.precisionpeptidecompany.com/about
SIGN_OFF: Pratap Sandhu, CEO, The Precision Peptide Company
NOTES: Needs Pratap's OK to send under his name

---

## Email #3: The questions people ask us first (1 day later)
Talking to: the careful first-timer, who doesn't know who to believe, when they're reading a forum argument at night about whether a site is legit
Idea: the site's own FAQ, answered like a chat.

SUBJECT (pick): The questions people ask us first
SUBJECT (option): Do I need a prescription? Yes, and here's why
PREVIEW (pick): Straight answers, no forum required
PREVIEW (option): Prescriptions, pharmacies, testing

HEADLINE: Forum threads argue about this stuff all night, so here are the plain answers
SUBHEADLINE: These are the questions people ask us before they start a protocol.
BUTTON: Read Our FAQ

Q1: "Do I need a prescription?" · Yes. A licensed US clinician prescribes every protocol after reviewing your health intake, typically within about 24 hours.
Q2: "Where is it made?" · At a 503A compounding pharmacy in the US. Every batch goes through independent third-party testing for purity and potency.
Q3: "How do I know which protocol is right for me?" · You complete an eligibility check, and a licensed clinician recommends a protocol based on your goals and health history.
Q4: "Are there side effects?" · They vary by protocol and person. Your clinician reviews your health history before approval and discusses the relevant risks.

WHY_TITLE: Why people choose us
WHY_1: You can look us up · Publicly listed on the CSE and OTCQB.
WHY_2: Your data stays private · Our telehealth process is HIPAA-compliant.
WHY_3: Discreet delivery · Protocols arrive discreetly packaged.
MID_BUTTON: Get Started
SAFETY_LINK: Full safety information · /safety-information

---

## Email #4: Choose your protocol (1 day later)
Talking to: the careful first-timer, who's ready but doesn't know where to begin, when they've got nine names in front of them and no idea which applies
Idea: the whole portfolio on one page, grouped the way the site groups it, with the price next to each.

SUBJECT (pick): All nine protocols, on one page
SUBJECT (option): Not sure where to start?
PREVIEW (pick): With the price next to every one
PREVIEW (option): And a clinician to help you choose

HEADLINE: Nine protocols, one page, and the price next to every one
SUBHEADLINE: Clear pricing, fast review, and fulfillment through a regulated pharmacy. Pick one to start, or let the clinician guide you.
BUTTON: Choose Your Protocol

GROUP_1_LABEL: Weight Loss · Semaglutide (As low as $159.67/month) · Tirzepatide (As low as $233/month)
GROUP_2_LABEL: Performance · Sermorelin (From $199/month) · BPC-157 (From $139/month) · TB-500 (As low as $125/month)
GROUP_3_LABEL: Longevity · NAD+ (From $179/month) · Epitalon (From $199/month) · MOTS-c (From $199/month) · Semax (From $249/month)
EACH_BUTTON: Get Started

OBJECTION_TITLE: Why does every protocol need a prescription?
OBJECTION_TEXT: Because a licensed clinician should decide what's right for you, not a checkout page. That's the whole reason we exist. Our blog explains it in plain English.
OBJECTION_BUTTON: Read the Blog

BANNER_HEADLINE: Still not sure?
BANNER_LINE: Start the eligibility check and a clinician recommends a protocol within 24 hours.
BANNER_BUTTON: Get Started

---

## Email #5: Protocols from $125 a month (1 day later, non-starters)
Talking to: the careful first-timer, who assumed this would cost a clinic-visit fortune, when they're about to close the tab and come back "some other time"
Idea: the price is the news. No discount, just the real number, said plainly.

SUBJECT (pick): Protocols start at $125 a month
SUBJECT (option): What a protocol actually costs
PREVIEW (pick): Clinician review included in the process
PREVIEW (option): Clear pricing, no surprises

HEADLINE: Our protocols start at
OFFER_NUMBER: $125
DEADLINE_LINE: a month, with TB-500. Every price is on the site before you fill in a single form.
BUTTON: View Protocols

WHY_NOW_TITLE: Still thinking it over?
WHY_NOW_TEXT: You signed up a few days ago. If cost was the question, here's the answer: clear pricing, a licensed clinician's review and a 503A pharmacy.

PRICE_LIST: TB-500 As low as $125/month · BPC-157 From $139/month · Semaglutide As low as $159.67/month · NAD+ From $179/month

USP_1: Clear pricing
USP_2: Review within 24 hours
USP_3: Discreet packaging
USP_4: Publicly listed

BANNER_KICKER: Takes a few minutes
BANNER_LINE: Start your intake today and a US-licensed clinician reviews it within 24 hours.
BANNER_BUTTON: Get Started

---

## SMS #2 (right after Email #5, consent only)
Precision Peptide: our protocols start at $125/month, with a licensed clinician's review within 24 hours. See every price: https://www.precisionpeptidecompany.com/protocols
