# The Precision Peptide Company: Flow strategy
_Updated 2026-11-26 · Pop-up + 6 flows · 20 emails (+3 Welcome #1 versions) + 7 SMS · Platform: Customer.io_

Status: draft · needs approval · goes live once each flow is built in Customer.io

**The point:** every flow now sells the nine prescription protocols on the website, and nothing else. No retail range, no discount codes, no merge tags in the copy. Each email answers one real doubt a person has between "I'm curious" and "a clinician has my intake".

## What changed from the first plan
- **Products:** the nine protocols on /protocols only, with the site's names, prices and Get Started links
- **Offers:** none anywhere. Prescription protocols are never discounted, so WELCOME10, WELCOME15, BROWSE10, MYSTERY, the second-order 15% and the winback 20% are all gone
- **The hook instead of a code:** clear pricing ("from $125/month"), the licensed clinician, the 503A pharmacy and the public listing
- **Pop-up question:** "Which protocol brought you here?" replaces "What brings you to Precision Peptide?"
- **Merge tags:** none in subjects, previews, SMS or images. The only tags left are links (checkout URL, product URL)
- **Images:** real product shots and site renders only, never made-up packaging

## Who we're talking to
- **The price checker:** has priced semaglutide or tirzepatide on five sites and wants to know which one has a real clinician behind it
- **The careful first-timer:** stops at the last step because they aren't sure who reads the intake
- **The private buyer:** doesn't want anyone guessing what's in the box
- **The researcher:** has read about NAD+, MOTS-c or BPC-157 and wants a clinician, not a forum, to decide

## The system at a glance
1. **Pop-up:** 4 steps, one question that splits Welcome #1
2. **Welcome:** 5 emails (Email #1 in 4 versions) + 2 SMS
3. **Site abandonment:** 2 emails
4. **Browse abandonment:** 3 emails + 1 SMS
5. **Abandoned checkout:** 4 emails + 2 SMS
6. **Post-purchase:** 4 emails + 1 SMS
7. **Winback:** 2 emails + 1 SMS

All flows: conversion goal = `order_created` within 5 days · SMS only to `sms_consent` = true · sender: Sarah from The Precision Peptide Company

## 1. Pop-up
- **Step 1:** Which protocol brought you here?
  - Semaglutide or Tirzepatide → `weight_loss`
  - Sermorelin, BPC-157 or TB-500 → `performance`
  - NAD+, Epitalon, MOTS-c or Semax → `longevity`
  - Not sure yet → `not_sure`
- **Step 2:** email, with the public-listing trust line
- **Step 3:** phone (optional) with the SMS consent line
- **Step 4:** "You're in." + Get Started
- **Show:** desktop after 8 seconds or 40% scroll, mobile after 10 seconds. Never on intake or checkout pages
- **Why:** the answer tells Welcome #1 which protocols to show, and stays on the profile for campaigns

## 2. Welcome (5 emails + 2 SMS)
- **Trigger:** pop-up sign-up (plus X and Reddit leads)
- **Exit:** `order_created`
- **Email #1, immediately, by pop-up answer**
  - `weight_loss`: Semaglutide and Tirzepatide, priced up front
  - `performance`: Sermorelin, BPC-157 and TB-500, prescribed properly
  - `longevity`: NAD+, Epitalon, MOTS-c and Semax, one clinician conversation
  - `not_sure` / no answer: the protocol, the prescriber and the pharmacy
- **SMS #1:** right after Email #1
- **Email #2, 4 hours later:** a note from Pratap on why the company listed publicly
- **Email #3, 1 day later:** the questions people ask first, answered like a chat
- **Email #4, 1 day later:** all nine protocols on one page, with prices
- **Email #5, 1 day later, non-starters only:** protocols from $125 a month
- **SMS #2:** right after Email #5

## 3. Site abandonment (2 emails)
- **Trigger:** `page_viewed`, no protocol viewed, no checkout, no order
- **Exit:** views a protocol, starts checkout or orders · re-entry after 7 days
- **Email #1, 2 hours later:** comparing peptide companies? Here's what you can actually check
- **Email #2, 1 day later:** every price, before you fill in a form

## 4. Browse abandonment (3 emails + 1 SMS)
- **Trigger:** `product_viewed` on a protocol page
- **Exit:** `checkout_started` or `order_created` · re-entry after 7 days
- **Email #1, 2 hours later:** still looking? Here's who'd be on the other side of it
- **Email #2, 1 day later:** the difference you can check, plus the three steps
- **SMS #1:** right after Email #2
- **Email #3, 1 day later:** not sure it's right for you? That's the clinician's job, within 24 hours
- **To do:** subjects for #1 and #3 still name the viewed protocol with a merge tag. Switch them to general wording to match the no-tag rule

## 5. Abandoned checkout (4 emails + 2 SMS)
- **Trigger:** `checkout_started`
- **Exit:** `order_created` · re-entry after 1 day
- **Email #1, 30 minutes later:** your checkout is saved (progress bar, step one done)
- **SMS #1:** right after Email #1
- **Email #2, 1 day later:** what happens after you submit (the next 24 hours as a timeline)
- **Email #3, 1 day later:** what shows up at your door (plain, discreet, from a 503A pharmacy)
- **SMS #2:** right after Email #3
- **Email #4, 1 day later:** what stopped you? (three self-sorting answers)

## 6. Post-purchase (4 emails + 1 SMS)
- **Trigger:** first `order_created` · once per person
- **Replaces:** Post Purchase Education (our best opens today, 18.2%)
- **Email #1, 5 minutes later:** a thank you from Pratap, and who to talk to from here
- **SMS #1:** right after Email #1
- **Email #2, 1 day later:** where your order is now (clinician, pharmacy, your door)
- **Email #3, 7 days after the order:** did everything arrive okay? Three quick questions from Pratap
- **Email #4, 11 days after the order:** keep this one. Who to ask for anything, plus the nine protocols
- **Rule:** every question about a prescription goes to the prescribing clinician through the account login. No use instructions in email

## 7. Winback (2 emails + 1 SMS)
- **Trigger:** 90 days after the last order with no new order (adjust once we see reorder data)
- **Exit:** `order_created`
- **Email #1:** still here, still public (ticker of CSE: BPC and OTCQB: PNGAF, all nine protocols)
- **SMS #1:** right after Email #1
- **Email #2, 5 days later:** starting again takes three steps, from $125 a month
- **Rule:** never "running low", "next round" or anything that implies someone needs more

## Live flows: what happens to each
- **Site sign-up Welcome** (stopped): archive, the new Welcome replaces it
- **Site sign-up Nurture (60 days)** (2,028 sent, 4.6% open): pause new entries once Welcome is live
- **Welcome, X Leads** (0 sent): broken trigger. Fold X and Reddit leads into the new Welcome
- **OTC Welcome (ads)** (223 sent, 0.9% open): retire. There's no retail line any more
- **Amino active / Amino list Nurture:** hold until the client tells us what "Amino" is
- **Post Purchase Education** (137 sent, 18.2% open): replace with the new Post-purchase
- **Untitled Automation 1:** archive

_Source: Customer.io audit, Oct 25 to Nov 24, 2026_

## Events we need from their platform
- **Have:** `order_created`
- **Need:** `page_viewed` (site) · `product_viewed` with name and URL (browse) · `checkout_started` with checkout URL (checkout) · `popup_answer` and `sms_consent` saved on the profile (pop-up)

## Build order
1. Sender domain and authentication (SPF, DKIM, DMARC), one sender
2. Pop-up + Welcome
3. Abandoned checkout, once `checkout_started` exists
4. Post-purchase
5. Browse, then site abandonment
6. Winback

## What we still need from the client
- Approval on every flow (review links in the setup sheet)
- Pratap's OK to sign Welcome #2 and Post-purchase #1 and #3
- Confirmation that customers reach their clinician through the account login
- Business address for the footer
- The form tool for the pop-up
