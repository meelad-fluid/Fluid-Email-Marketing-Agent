# Post-purchase and winback: copy
_Client: The Precision Peptide Company · Platform: Customer.io · Rewritten 2026-11-26 for the prescription protocols only_
Status: draft · needs approval · goes live once built in Customer.io
From: Sarah from The Precision Peptide Company · #1 and #3 signed by Pratap Sandhu, CEO (needs his OK)

**What changed (2026-11-26, Gloria):** the website sells only the nine prescription protocols. Retail range, Recovery Patch/KPV/BPC capsules, THANKYOU15 and COMEBACK20 are gone. No discounts (prescription protocols are never discounted). No merge tags in any line, subject, preview or SMS (general language only); the only tag is a link where a link needs one.

**Rules for these flows:** no use instructions, dosing, timelines or outcomes. Every question about a prescription goes to the prescribing clinician (via Login: https://my.precisionpeptidecompany.com/login). Order, shipping and company questions go to our team (/contact or reply). Winback never implies someone ran out or needs more. Products only by name and price from /protocols.

LEGAL_LINE and TAGLINE: same as the Welcome flow (site disclaimer incl. compounded-medication line; "Done properly. Done legally. Done once.").

---

# Post-purchase (4 emails + 1 SMS)

## Email #1: A thank you from Pratap (5 minutes after the first order)
Talking to: the person who just paid for their first protocol online, who's used to sites that go quiet after checkout, when they're refreshing their inbox for proof a real company has their order
Idea: a signed note from the CEO of a publicly listed company. Not a receipt, a person.

SUBJECT (pick): A thank you from our CEO
SUBJECT (option): Thank you for trusting us with this
PREVIEW (pick): And who to talk to from here
PREVIEW (option): Your order is in good hands

GREETING: Hi there,
PARAGRAPH_1: Thank you for your first order with The Precision Peptide Company. Choosing who to trust with your health online is a real decision, and I don't take it lightly.
PARAGRAPH_2: From here, a US-licensed clinician reviews your intake. If they prescribe your protocol, it's filled by a licensed 503A pharmacy in the US and shipped in plain, discreet packaging.
PARAGRAPH_3: We're a publicly listed company (CSE: BPC, OTCQB: PNGAF), so you can look us up any time. And if anything about your order isn't right, reply to this email. A real person on our team reads every one.
SIGN_OFF: Pratap Sandhu, CEO, The Precision Peptide Company
BUTTON: Log In to Your Account
[slot for one real line from Pratap, e.g. why he started the company]

## SMS #1 (right after Email #1, consent only)
Precision Peptide: thank you for your order. A licensed clinician reviews your intake next. Questions? Reply to our email anytime.

## Email #2: Where your order is now (1 day later)
Talking to: the first-time buyer, who's checking their email between meetings, when they want to know exactly what's happening with their order without having to ask
Idea: an order tracker. Three stops, and a pin on where they are.

SUBJECT (pick): Where your order is right now
SUBJECT (option): Here's what happens next
PREVIEW (pick): Three stops, and who to ask at each one
PREVIEW (option): Clinician, pharmacy, your door

HEADLINE: Your order has three stops. Here's every one.
SUBHEADLINE: Clinician review, pharmacy fulfillment, then your door. You can check where it is any time in your account.
BUTTON: Track My Order

TRACKER:
- STOP 1 · Clinician review · A US-licensed clinician reviews your health intake.
- STOP 2 · Pharmacy fulfillment · If prescribed, your protocol is filled by a US 503A compounding pharmacy.
- STOP 3 · Your door · It ships in plain, discreet packaging.

WHO_TO_ASK_TITLE: Got a question? Here's who answers it.
- About your prescription · Your prescribing clinician, through your account · BUTTON: Log In
- About your order or delivery · Our team · BUTTON: Contact Us

## Email #3: Did it arrive okay? (plain-text style, 7 days later)
Talking to: the person who's had their package for a day or two, who's used to vendors that disappear after the sale, when they're deciding if we were worth trusting
Idea: the CEO checks in himself, and asks about the service, never about them.

SUBJECT (pick): Did everything arrive okay?
SUBJECT (option): Quick question about your order
PREVIEW (pick): A real person reads the replies
PREVIEW (option): Two minutes, if you have them

GREETING: Hi there,
PARAGRAPH_1: Your order should have reached you by now, and I wanted to check it turned up the way it should have.
PARAGRAPH_2: Did it arrive on time? Was the packaging discreet? Was anything about the process unclear? If something wasn't right, reply and tell me. We'd much rather fix it than have you wonder.
PARAGRAPH_3: Any question about your prescription itself is for your clinician, and you can reach them through your account.
SIGN_OFF: Pratap Sandhu, CEO, The Precision Peptide Company
BUTTON_1: Reply to Pratap (→ /contact)
BUTTON_2: Log In
[review link: add a "leave a review of our service" line once the client has one]

## Email #4: Who to ask, for anything (4 days later)
Talking to: the settled-in customer, who has their protocol and a dozen small questions, when one of them comes up at 10pm and they don't know where to send it
Idea: a directory card. Every kind of question, and the one place it goes.

SUBJECT (pick): Keep this one
SUBJECT (option): Who to ask, for anything
PREVIEW (pick): Every question has a place to go
PREVIEW (option): Your clinician, our team and your account

HEADLINE: Every question has a place to go. Here's the list.
SUBHEADLINE: Save this email and you'll never have to hunt for who to ask.
BUTTON: Log In to Your Account

DIRECTORY:
- "Is my protocol still the right one?" · Your clinician · Log In
- "Where's my order?" · Your account · Track My Order
- "Something's off with my delivery." · Our team · Contact Us
- "How does billing work?" · Our refund policy and our team · Read the Policy (→ /refund-policy)
- "I want to read up on peptides." · The blog · Read the Blog (→ /blog)

RANGE_TITLE: Nine protocols, one process
RANGE_TEXT: Every protocol on our site is prescribed by a licensed US clinician and filled by a 503A pharmacy. If you ever wonder whether another one fits, your clinician is the one to ask.
RANGE_BUTTON: View All Protocols

---

# Winback (2 emails + 1 SMS)
Trigger: 90 days after the last order, no new order. No offer.

## Email #1: Still the company you can look up (90 days after last order)
Talking to: the past customer who's seen three new peptide sites in their feed this month, when they're wondering which ones are even real
Idea: a stock-ticker card. Everything that was true when they ordered is still true, and public.

SUBJECT (pick): Still here, still public
SUBJECT (option): A quick note from Precision Peptide
PREVIEW (pick): CSE: BPC and OTCQB: PNGAF, same as before
PREVIEW (option): The protocol, the prescriber, the pharmacy

HEADLINE: New sites every week. We're still the one you can look up.
SUBHEADLINE: Same licensed US clinicians, same 503A pharmacy, same public listing. Whenever you're ready, starting again takes a few minutes.
BUTTON: Get Started

TICKER: CSE: BPC · OTCQB: PNGAF · LegitScript certified
STILL_TRUE_TITLE: Still true
- A US-licensed clinician reviews every intake
- A US 503A compounding pharmacy fills every prescription
- Every order ships in plain, discreet packaging
PROTOCOLS_TITLE: All nine protocols
Semaglutide (as low as $159.67/month) · Tirzepatide (as low as $233/month) · Sermorelin (from $199/month) · BPC-157 (from $139/month) · TB-500 (as low as $125/month) · NAD+ (from $179/month) · Epitalon (from $199/month) · MOTS-c (from $199/month) · Semax (from $249/month)
BUTTON: View All Protocols

## SMS #1 (right after Email #1, consent only)
Precision Peptide: still here, still the same licensed clinicians and 503A pharmacy. Whenever you're ready: https://www.precisionpeptidecompany.com/protocols

## Email #2: Starting again is three steps (5 days later)
Talking to: the past customer who meant to come back and keeps putting it off, when they picture filling in a long form all over again
Idea: the maths of coming back. Three steps, a few minutes, prices on the page.

SUBJECT (pick): Starting again takes three steps
SUBJECT (option): The short version of getting back
PREVIEW (pick): Pick, intake, clinician review
PREVIEW (option): No long form, no guesswork

HEADLINE: Coming back takes three steps, not a fresh start.
SUBHEADLINE: Choose your protocol, complete a short intake, and a licensed US clinician reviews it within 24 hours.
BUTTON: Get Started

STEPS:
1. Choose your protocol · Clear pricing on every page.
2. Complete your intake · A few minutes, private and secure.
3. Clinician review · Within 24 hours. If prescribed, it ships from a 503A pharmacy.

PRICE_STRIP: Protocols from $125/month · BUTTON: Choose My Protocol
CLOSING_LINE: If something about your last order put you off, reply and tell us. Sarah, The Precision Peptide Company

NOTES
- PP #1 and #3 are signed by Pratap: needs his OK, plus one real line from him
- Clinician access through the account login is assumed from the site's Login link: confirm with the client
- "Within 24 hours" review is the site's own line
- Review link for PP #3 still needed
