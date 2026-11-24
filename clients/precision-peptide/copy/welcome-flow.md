# Welcome flow: copy (pop-up + 7 emails + 2 SMS)
_Client: The Precision Peptide Company · Platform: Customer.io · Written 2026-11-24_
Status: draft · needs approval · goes live once built in Customer.io
From: Sarah from The Precision Peptide Company (proposed persona) · founder notes from Pratap Sandhu

**Compliance basis:** claims, disclaimers and offers approved by Meelad (Fluid), Slack, 2026-11-24. Only compliance.md §5 facts are used. No outcomes, dosing or effect categories. Offers apply to the retail range only; prescription programs are never discounted.

**Links used**
- Home / retail: https://www.precisionpeptidecompany.com (retail shop URL still needed from the client)
- Protocols: https://www.precisionpeptidecompany.com/protocols
- About: https://www.precisionpeptidecompany.com/about
- FAQ: https://www.precisionpeptidecompany.com/faq
- Eligibility check: https://www.precisionpeptidecompany.com (the "Get Started" chooser)

**Legal line (every email)**
LEGAL_LINE: The Precision Peptide Company · CSE: BPC | OTCQB: PNGAF · [business address needed] · Content on this site is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Individual results may vary. Prescription products may not be appropriate for all individuals. The products and services offered by The Precision Peptide Company require a prescription issued by a licensed US clinician following a clinical review. · Unsubscribe · Manage preferences

TAGLINE: Done properly. Done legally. Done once.

---

## Pop-up

**Step 1**
- HEADLINE: Want 10% off your first order?
- QUESTION: What brought you to Precision Peptide today?
- ANSWER 1: A company I can actually check out (`verify`)
- ANSWER 2: A needle-free option (`needle_free`)
- ANSWER 3: A prescription program (`rx`)

**Step 2**
- HEADLINE: Where should we send your code?
- SUB: 10% off your first retail order, plus plain-English answers to the questions people ask us most.
- FIELD: Email
- BUTTON: Continue
- TRUST LINE: Publicly listed on the CSE (BPC) and OTCQB (PNGAF).

**Step 3**
- HEADLINE: Want it by text too?
- SUB: We only text about new products, restocks and your orders, a few times a month.
- FIELD: Phone number
- BUTTON: Yes, Text Me
- SECONDARY: No thanks, email is fine
- CONSENT: By submitting you agree to receive recurring automated marketing texts from The Precision Peptide Company. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to cancel.

**Step 4**
- HEADLINE: You're in.
- SUB: Your code is WELCOME10 for 10% off the retail range. It's in your inbox now too.
- BUTTON: Shop Now

---

## Email #1 (track A, answered `verify`)
Template: welcome/01-welcome-offer
Talking to: the gray-market switcher, who can't tell who's really behind the sites they've bought from, when they're searching a vendor's name with "scam" over morning coffee

SUBJECT (pick): You can look us up, and we hope you do
SUBJECT (option): Your 10% code, from a company with a ticker
SUBJECT (option): Welcome to The Precision Peptide Company
PREVIEW (pick): Here's your code, and here's who we are
PREVIEW (option): CSE: BPC and OTCQB: PNGAF, for a start

HEADLINE: If you've ever searched a peptide company's name with "scam" after it, this one's for you
SUBHEADLINE_WITH_OFFER: We're a publicly listed company, so everything about us is on the record. Your 10% welcome code works on the whole retail range.
BUTTON: Shop Now
CODE_LABEL: Your code
CODE: WELCOME10

STORY_TITLE: You shouldn't have to guess who you're buying from
STORY_PARAGRAPH_1: A lot of peptide sites look the same. There's no name on the about page, no address you can find, and nobody answers when you write in.
STORY_PARAGRAPH_2: You end up reading forum threads late at night, trying to work out which one is real. We built Precision Peptide so you never have to do that with us.
BENEFIT_1_TITLE: Publicly listed
BENEFIT_1_TEXT: We trade on the CSE as BPC and on the OTCQB as PNGAF, so our filings are public.
BENEFIT_2_TITLE: Licensed US clinicians
BENEFIT_2_TEXT: Every prescription program is reviewed by a US-licensed clinician after a private health intake.
BENEFIT_3_TITLE: Independent third-party testing
BENEFIT_3_TEXT: Every batch goes through independent third-party testing for purity and potency.
STORY_CLOSING_LINE: Our people are named on our about page, from our CEO to our Chief Scientific Officer.

INTEREST_TITLE: Check us the way you'd check anyone
INTEREST_TEXT: Look up our ticker, find the LegitScript seal on our site, and read who sits on our board. We'd rather you verify us than take our word for it.

PRODUCTS_TITLE: Where most people start
PRODUCT_1_NAME: Recovery Patch
PRODUCT_1_BUTTON: Shop Now
PRODUCT_2_NAME: KPV
PRODUCT_2_BUTTON: Shop Now
PRODUCT_3_NAME: BPC
PRODUCT_3_BUTTON: Shop Now
SHOP_ALL_BUTTON: Shop Now

USP_1: Publicly listed
USP_2: Licensed US clinicians
USP_3: Third-party tested
USP_4: Made in the USA

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (approved facts only, no outcomes; product blocks are name + button)
- Framework: PAS (problem = unverifiable vendors)
- Subject pick: invites the exact behavior this avatar already does
- Open: retail shop URL; best first-order products (picked from the form and press until we have order data)

---

## Email #1 v2 (track B, answered `needle_free`)
Template: welcome/01-welcome-offer
Talking to: the needle-averse buyer, who's put off by vials, mixing and fridges, when they're moving vials around the fridge door

SUBJECT (pick): Your 10% code, no fridge required
SUBJECT (option): Peptides in a patch, plus 10% off
SUBJECT (option): Welcome to Precision Peptide
PREVIEW (pick): No mixing and no measuring either
PREVIEW (option): Here's why the patch is our best seller

HEADLINE: If you've ever moved vials around the fridge door to fit the milk in, you'll like the patch
SUBHEADLINE_WITH_OFFER: The Recovery Patch is our best seller, and it needs no mixing, no measuring and no refrigeration. Your 10% welcome code works on the whole retail range.
BUTTON: Shop Now
CODE_LABEL: Your code
CODE: WELCOME10

STORY_TITLE: The kit on the counter gets old fast
STORY_PARAGRAPH_1: Vials need space in the fridge, mixing needs a steady hand, and travel means packing a cold bag.
STORY_PARAGRAPH_2: Plenty of people tell us they wanted peptides without any of that. That's why the patch came first in our retail range.
BENEFIT_1_TITLE: No mixing
BENEFIT_1_TEXT: It comes ready, so there's nothing to prepare.
BENEFIT_2_TITLE: No measuring
BENEFIT_2_TEXT: There's nothing to draw up or get wrong.
BENEFIT_3_TITLE: No refrigeration
BENEFIT_3_TEXT: It stays in a drawer or a bag, not the fridge door.
STORY_CLOSING_LINE: Every batch goes through independent third-party testing, and our retail products are made to cGMP standards.

INTEREST_TITLE: It fits in a bag
INTEREST_TEXT: Because there's no cold storage, the patch travels the way the rest of your things do.

PRODUCTS_TITLE: The retail range
PRODUCT_1_NAME: Recovery Patch
PRODUCT_1_BUTTON: Shop Now
PRODUCT_2_NAME: KPV
PRODUCT_2_BUTTON: Shop Now
PRODUCT_3_NAME: BPC
PRODUCT_3_BUTTON: Shop Now
SHOP_ALL_BUTTON: Shop Now

USP_1: Needle-free patch
USP_2: Made to cGMP standards
USP_3: Third-party tested
USP_4: Made in the USA

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (format facts from the press release only; product name used, no effect described)
- Framework: BAB (kit on the counter → patch in a drawer)
- Open: confirm KPV and BPC capsules are live retail products and their URLs

---

## Email #1 v3 (track C, answered `rx`)
Template: welcome/01-welcome-offer
Talking to: the telehealth-first patient, who wants a prescription program without a clinic visit, when they're looking at a six-week wait for an appointment

SUBJECT (pick): A clinician's review within 24 hours
SUBJECT (option): How our prescription programs work
SUBJECT (option): Welcome to Precision Peptide
PREVIEW (pick): Three steps, all online, no insurance needed
PREVIEW (option): Plus 10% off our retail range

HEADLINE: If the next clinic appointment is six weeks away, you can start here today
SUBHEADLINE_WITH_OFFER: Fill in a private online intake and a US-licensed clinician reviews it within 24 hours. No insurance is needed.
BUTTON: Get Started
CODE_LABEL: 10% off the retail range
CODE: WELCOME10

STORY_TITLE: Waiting rooms and coverage letters aren't the only way
STORY_PARAGRAPH_1: You call, you get the next slot in six weeks, and then you find out insurance won't cover it anyway.
STORY_PARAGRAPH_2: Our programs run online from start to finish, with a licensed clinician and a licensed pharmacy behind every prescription.
BENEFIT_1_TITLE: 1. Health assessment
BENEFIT_1_TEXT: A secure, private intake covering your goals, health history and eligibility.
BENEFIT_2_TITLE: 2. Medical review
BENEFIT_2_TEXT: A US-licensed clinician reviews your intake within 24 hours.
BENEFIT_3_TITLE: 3. Pharmacy fulfillment
BENEFIT_3_TEXT: If prescribed, it ships from a 503A pharmacy in discreet packaging.
STORY_CLOSING_LINE: Every prescription comes from a licensed US clinician after a clinical review, and some programs won't be right for everyone.

INTEREST_TITLE: Questions before you start?
INTEREST_TEXT: Our FAQ covers prescriptions, side effects and how the review works, and our team answers if you write in.

PRODUCTS_TITLE: Our programs
PRODUCT_1_NAME: GLP-1
PRODUCT_1_BUTTON: View Protocols
PRODUCT_2_NAME: Sermorelin
PRODUCT_2_BUTTON: View Protocols
PRODUCT_3_NAME: NAD+
PRODUCT_3_BUTTON: View Protocols
SHOP_ALL_BUTTON: Get Started

USP_1: Licensed US clinicians
USP_2: 503A pharmacy
USP_3: No insurance needed
USP_4: HIPAA-compliant

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (process steps quoted from the site; program names only, no effect labels; the prescription and "not for everyone" lines are in the body; code limited to retail)
- Framework: PAS
- Open: whether the welcome code should appear at all on the Rx track (kept small, retail only)

---

## SMS #1 (immediately after Email #1, consent only)
Precision Peptide: welcome in. Your code WELCOME10 takes 10% off our retail range, including the needle-free Recovery Patch: https://www.precisionpeptidecompany.com

---

## Email #2: A note from Pratap (plain text, 4 hours later)
Template: welcome/02a-founder-note-plain
Talking to: the gray-market switcher, who's been burned by vendors that vanish, when they're emailing a vendor for the third time with no reply

SUBJECT (pick): Why we listed the company publicly
SUBJECT (option): A quick note from our CEO
PREVIEW (pick): It wasn't the easy way to do it
PREVIEW (option): And why you can always reach us

GREETING: Hi {{customer.first_name | default: "there"}},
PARAGRAPH_1: I'm Pratap, the CEO of The Precision Peptide Company. I wanted to write to you myself, because the reason this company exists is pretty simple.
PARAGRAPH_2: Too many people buy peptides from sellers they can't look up, can't call and can't hold to anything. We went the other way. We listed the company publicly, so our filings are open to anyone, and we built every prescription program around licensed US clinicians and a licensed pharmacy.
PARAGRAPH_3: Our line for it is "done properly, done legally, done once." It's slower and it costs more to run a company this way, and we think that's exactly the point.
OFFER_LINE: Your code WELCOME10 still takes 10% off our retail range whenever you're ready.
REPLY_INVITE: If anything about us isn't clear, just reply to this email. It comes to our team, and real people answer it.
TEXT_LINK: Read who we are: https://www.precisionpeptidecompany.com/about
SIGN_OFF: Pratap Sandhu, CEO, The Precision Peptide Company

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW
- Framework: PAS as a letter
- Needs Pratap's OK to send under his name

---

## Email #3: The questions people ask us first (1 day later)
Template: welcome/03-reviews (review slots replaced by FAQ; reviews about personal results can't be used and we have none yet)
Talking to: the gray-market switcher, who doesn't know who to believe, when they're reading a forum argument about whether a product is legit at night

SUBJECT (pick): The questions people ask us first
SUBJECT (option): Do you need a prescription? It depends
PREVIEW (pick): Straight answers, no forum required
PREVIEW (option): Plus your 10% code, still waiting

HEADLINE: Forum threads argue about this stuff all night, so here are the plain answers
SUBHEADLINE_WITH_OFFER: These are the questions people ask us before their first order. Your 10% code is still waiting for the retail range.
BUTTON: Read Our FAQ
CODE_LABEL: Your code
CODE: WELCOME10

FRAMING_LINE: What people ask us first
REVIEW_1_QUOTE: "Do I need a prescription?" For our prescription programs, yes. A licensed US clinician prescribes every one after reviewing your health intake, usually within 24 hours.
REVIEW_1_NAME: Prescriptions
REVIEW_2_QUOTE: "Where is it made?" Prescription programs ship from a 503A compounding pharmacy in the US. Our retail products are made to cGMP standards.
REVIEW_2_NAME: Where it's made
REVIEW_3_QUOTE: "Is it tested?" Every batch goes through independent third-party testing for purity and potency.
REVIEW_3_NAME: Testing

WHY_TITLE: Why people switch to us
WHY_1_TITLE: You can look us up
WHY_1_TEXT: We're publicly listed on the CSE and OTCQB.
WHY_2_TITLE: Real people answer
WHY_2_TEXT: Reply to any of our emails and our team picks it up.
WHY_3_TITLE: Discreet delivery
WHY_3_TEXT: Orders arrive in plain, discreet packaging.
CODE_REMINDER_LINE: WELCOME10 takes 10% off the retail range.
MID_BUTTON: Shop Now

PRODUCTS_TITLE: Start with our best seller
PRODUCT_1_NAME: Recovery Patch
PRODUCT_1_BUTTON: Shop Now
PRODUCT_2_NAME: Explore Protocols
PRODUCT_2_BUTTON: View Protocols

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (answers paraphrase the site FAQ and home page; no side-effect or outcome claims)
- Swap in real service reviews (delivery, support) once the client has them
- "Discreet packaging" is a site claim for Rx; confirm it applies to retail orders too

---

## Email #4: Where most people start (1 day later)
Template: welcome/04-best-sellers
Talking to: the needle-averse buyer, who wants something simple to start with, when they're throwing things in a gym bag before work

SUBJECT (pick): Where most people start with us
SUBJECT (option): Patch or program?
PREVIEW (pick): Two ways in, and how to pick
PREVIEW (option): Your 10% code works on one of them

HEADLINE: Not sure where to start? Most people pick one of two ways in
SUBHEADLINE_WITH_OFFER: Start with the retail range and your 10% code, or start a prescription program with a clinician's review.
BUTTON: Shop Now
CODE_LABEL: Your code
CODE: WELCOME10

CHOOSE_TITLE: Two ways to start
OPTION_1_TITLE: The retail range
OPTION_1_TEXT: No prescription needed. The needle-free Recovery Patch is our best seller, and your code works here.
OPTION_2_TITLE: Prescription programs
OPTION_2_TEXT: A private intake, a licensed clinician's review within 24 hours, and a 503A pharmacy.

BEST_SELLERS_TITLE: Our best sellers
PRODUCT_1_NAME: Recovery Patch
PRODUCT_1_BUTTON: Shop Now
PRODUCT_2_NAME: KPV
PRODUCT_2_BUTTON: Shop Now

OBJECTION_TITLE: Why does one need a prescription and the other doesn't?
OBJECTION_PARAGRAPH_1: Some peptides can only be supplied with a prescription, so a licensed clinician has to review you first. Others are sold at retail.
OBJECTION_PARAGRAPH_2: We keep both on the right side of the rules, which is the whole reason we exist. Our blog explains the difference in plain English.

BANNER_HEADLINE: Your 10% is still here
BANNER_LINE: WELCOME10 takes 10% off the retail range.
BANNER_BUTTON: Shop Now
DYNAMIC_NOTE: none (static products until order data exists)

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (Rx/retail split echoes the site blog title "Do You Need a Prescription for Peptides? It Depends Which One"; no effect claims)
- Best sellers from the form ("needle-free patches"); replace with order data when we get it

---

## Email #5: 15% for the next 24 hours (1 day later, non-buyers)
Template: welcome/05-upgrade-offer
Talking to: the needle-averse buyer, who's been meaning to try the patch, when they're opening the fridge and seeing the vials again

SUBJECT (pick): Your code just went up to 15%
SUBJECT (option): 15% off, for the next 24 hours
PREVIEW (pick): For the next 24 hours only
PREVIEW (option): On the whole retail range

HEADLINE: We've bumped your welcome code to
OFFER_NUMBER: 15% off
DEADLINE_LINE: on the whole retail range, for the next 24 hours
BUTTON: Shop Now
CODE_LABEL: Your new code
CODE: WELCOME15

WHY_NOW_TITLE: Still thinking it over?
WHY_NOW_PARAGRAPH_1: You signed up a few days ago, and we'd like your first order to be an easy one.
WHY_NOW_PARAGRAPH_2: So for the next 24 hours your code takes 15% off anything in the retail range, including the Recovery Patch.

USP_1: Needle-free patch
USP_2: Third-party tested
USP_3: Discreet packaging
USP_4: Publicly listed

BANNER_KICKER: Ends in 24 hours
BANNER_LINE: WELCOME15 takes 15% off the retail range. Prescription programs aren't included.
BANNER_BUTTON: Shop Now

NOTES
- Compliance gate: PASS — READY FOR HUMAN REVIEW (offer within the approved 25% max, retail only, exclusion stated)
- Code WELCOME15 must be created on their platform with a 24-hour window per person, or as a single-use code pushed from Customer.io

---

## SMS #2 (right after Email #5, consent only)
Precision Peptide: for the next 24 hours your code is WELCOME15 for 15% off our retail range. https://www.precisionpeptidecompany.com
