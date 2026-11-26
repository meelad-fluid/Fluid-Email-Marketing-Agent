# Precision Peptide: Customer.io setup sheet
_Prepared 2026-11-24 · Goes with the flow plan · Status: draft, nothing built yet_

**The point:** these are the segments, settings and automation shells for all six flows. Emails drop in once copy clears compliance (gate: ESCALATE, see compliance.md).

## 1. Sending setup (do first)
1. **One sender:** Sarah from The Precision Peptide Company, sending from @precisionpeptidecompany.com (proposed, needs approval)
2. **Authenticate the domain:** SPF, DKIM and DMARC verified in Customer.io
3. **Retire for marketing:** info@precisionpep.co, orders@precisionpep.co, support@tppc.co
4. **Footer layout:** business address (missing), unsubscribe `{% unsubscribe_url %}`, preferences `{% manage_subscription_preferences_url %}`, the approved disclaimer once counsel provides it
5. **Subscription topic:** one "Marketing" topic, so transactional mail stays separate

## 2. Segments to create (data-driven)
- **Engaged 30 / 60 / 90 / 120**
  - Opened or clicked any email in the last N days, OR performed `order_created` in the last N days
  - AND email is valid and the person is subscribed
- **New Subs (Engaged 30 ex. Purchasers)**
  - Created in the last 30 days
  - AND opened or clicked any email in the last 30 days
  - AND no `order_created` in the last 30 days
- **Placed Order 7d / 14d / 30d**
  - Performed `order_created` in the last 7 / 14 / 30 days
- **Lapsed Customers (Winback)**
  - Performed `order_created` at least once
  - AND no `order_created` in the last 180 days
  - AND subscribed
- **Unengaged 120** (for a later sunset flow)
  - No opens, clicks or `order_created` in 120 days, created over 120 days ago
- **Retail buyers / Rx buyers**
  - `order_created` where `line` = retail / rx (needs the new `line` field)

## 3. Pop-up
- **Tool:** to confirm. Customer.io stores the answer from any form tool that can pass attributes.
- **Steps**
  1. Question: "What brings you to Precision Peptide?"
     - A company I can actually verify → `popup_answer` = `verify`
     - A needle-free option → `popup_answer` = `needle_free`
     - A prescription program → `popup_answer` = `rx`
  2. Email
  3. Phone, skippable, with the consent line → `sms_consent` = true
  4. Confirmation with the welcome code and one button
- **Offer:** 10% (proposed, retail only until counsel decides on Rx)
- **Wording:** held for compliance approval

## 4. Automations
Every automation: conversion goal = `order_created` within 5 days. Smart sending off. SMS steps filtered to `sms_consent` = true.

**Welcome (7 emails + 2 SMS)**
- Trigger: segment entry, new pop-up sign-ups (plus X Leads and Reddit Leads)
- Frequency: once per person
- Exit: performed `order_created`
- Steps
  1. Branch on `popup_answer` (updated 2026-11-26): `weight_loss` → Email 1 v2 · `performance` → Email 1 v3 · `longevity` → Email 1 v4 (https://fluid-email-marketing-agent-production.up.railway.app/r/dXYxBm2J71BddFjhpMCGCjM6) · `not_sure` / none → Email 1 v1. No welcome code any more (protocols aren't discounted)
  2. SMS 1
  3. Wait 4 hours → Email 2 (plain text)
  4. Wait 1 day → Email 3
  5. Wait 1 day → Email 4
  6. Wait 1 day → Email 5
  7. SMS 2
- Replaces: Site sign-up Welcome, Welcome X Leads, OTC Welcome (ads)
- Designs (2026-11-24, all in review; whole flow: https://fluid-email-marketing-agent-production.up.railway.app/f/qbDPo_LdzsonsHx4B9B1I7ie)
  - Email 1 (verify): https://fluid-email-marketing-agent-production.up.railway.app/r/VlFuCPosZf8RYeXrNsNPMAY7
  - Email 1 v2 (needle_free): https://fluid-email-marketing-agent-production.up.railway.app/r/Xn1exzcHS-apF_pRvFSg70aZ
  - Email 1 v3 (rx / no answer): https://fluid-email-marketing-agent-production.up.railway.app/r/1giZZlhoTQKOuTBaQ_gGxwZe
  - Email 2 (founder note): https://fluid-email-marketing-agent-production.up.railway.app/r/0S3-cTf5YYKW0fI7qOpBML1O
  - Email 3 (FAQ): https://fluid-email-marketing-agent-production.up.railway.app/r/ZokYn3cKvchiThQeRj9J4PBp
  - Email 4 (two ways in): https://fluid-email-marketing-agent-production.up.railway.app/r/6kp4__pjVonkaSe7SO0f2fAE
  - Email 5 (15%, non-buyers): https://fluid-email-marketing-agent-production.up.railway.app/r/ieTIrtR8mvrcemt9XMul46MX
  - Subjects, previews and SMS text: copy/welcome-flow.md. Email HTML comes from each design's build/customerio.html after a push.

**Site abandonment (2 emails)**
- Trigger: event `page_viewed`
- Filter: no `product_viewed`, `checkout_started` or `order_created` in the last 1 day
- Frequency: every 7 days at most
- Exit: performs `product_viewed`, `checkout_started` or `order_created`
- Steps: wait 2 hours → Email 1 · wait 1 day → Email 2
- Designs (2026-11-26, in review; whole flow: https://fluid-email-marketing-agent-production.up.railway.app/f/Xdb4I5GQ9bsRr8OniJMa3e2D)
  - Email 1 (tell us apart): https://fluid-email-marketing-agent-production.up.railway.app/r/u0T3mEgm_r0vD7Fi1mkeVPBt
  - Email 2 (start with the patch): https://fluid-email-marketing-agent-production.up.railway.app/r/tEMnyyKfiwRD8Fenox5UsE7H
  - Subjects/previews: copy/abandonment-flows.md

**Browse abandonment (3 emails + 1 SMS)**
- Trigger: event `product_viewed`
- Frequency: every 7 days at most
- Exit: performs `checkout_started` or `order_created`
- Steps: wait 2 hours → Email 1 · wait 1 day → Email 2 → SMS 1 · wait 1 day → Email 3
- Liquid: `{{event.product_name}}`, `{{event.product_url}}`, `{{event.image_url}}`
- No branching or codes needed (2026-11-26: the site sells prescription protocols only). Buttons go to {{event.product_url}}#intake
- Designs (2026-11-26, in review; whole flow: https://fluid-email-marketing-agent-production.up.railway.app/f/JzhuQKqe1MTJffak3zO7VlpO)
  - Email 1 (still looking): https://fluid-email-marketing-agent-production.up.railway.app/r/JitnAjGTYb8qZP_Lke3ogiJQ
  - Email 2 (why people switch, BROWSE10): https://fluid-email-marketing-agent-production.up.railway.app/r/ufznx3TQPdlnYHSKup65nxCz
  - Email 3 (code ends tonight): https://fluid-email-marketing-agent-production.up.railway.app/r/D9XT-w-ZSS_2Z9YWh6BsLIZP
  - SMS 1 text: copy/abandonment-flows.md

**Abandoned checkout (4 emails + 2 SMS)** · no discount (protocols only) · flow review page: https://fluid-email-marketing-agent-production.up.railway.app/f/bTjoPX7G-Cz72ztDQ4AW0ylP
- Trigger: event `checkout_started`
- Frequency: every 1 day at most
- Exit: performs `order_created`
- Steps: wait 30 min → Email 1 → SMS 1 · wait 1 day → Email 2 · wait 1 day → Email 3 → SMS 2 · wait 1 day → Email 4
- Liquid: `{% assign protocol = event.items[0].product_name %}` at the top; `{% for item in event.items %}` loop for the checkout card (image_url, product_name, price); every checkout button → `{{event.checkout_url}}`
  - Email 1 (your checkout is saved): https://fluid-email-marketing-agent-production.up.railway.app/r/_5EPvXIfCnDNcZtYs1GSdHcG
  - Email 2 (what happens after you submit): https://fluid-email-marketing-agent-production.up.railway.app/r/TjGxQscZyz0V6uBdYt8MpMMl
  - Email 3 (what shows up at your door): https://fluid-email-marketing-agent-production.up.railway.app/r/QKlVLN3Wc1gt7DosJ9I_hJaF
  - Email 4 (what stopped you?): https://fluid-email-marketing-agent-production.up.railway.app/r/WEomPmOFWN0WBmbQ58hPeweK
  - SMS 1 and 2: copy/abandonment-flows.md

**Post-purchase (4 emails + 1 SMS)**
- Trigger: event `order_created`
- Filter: first order only (`order_created` count = 1)
- Frequency: once per person
- Steps: wait 5 min → Email 1 (plain text) → SMS 1 · wait 1 day → Email 2 · wait 7 days → Email 3 (plain text) · wait 2 days → Email 4
- Replaces: Post Purchase Education, after its content is reviewed

**Winback (2 emails + 1 SMS)**
- Trigger: event `order_created`, first order only
- Steps: wait 90 days → check no `order_created` since → Email 1 → SMS 1 · wait 5 days → Email 2
- Exit: performs `order_created`

## 5. Clean-up
- Pause new entries to Site sign-up Nurture (60 days) when Welcome goes live
- Archive Untitled Automation 1 and Site sign-up Welcome
- Hold Amino active and Amino list Nurture until the client says what Amino is

## 6. Discount codes (proposed, need approval, retail only)
- WELCOME10 · 10%
- WELCOME15 · 15%, 24 hours
- BROWSE10 · 10%
- MYSTERY · dropped 2026-11-26: the abandoned checkout flow has no discount (prescription protocols aren't discounted)
- Second order · 15%
- Winback · 20%
- Created on their custom platform by the client (we can't create codes there)
