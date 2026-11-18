---
name: fluid-customerio
description: Fluid Creatives' Customer.io specialist. How to report on, plan for and build emails into Customer.io instead of Klaviyo: its terms (automations = flows, one-time sends = campaigns), how revenue is attributed from order events, pushing finished designs as draft one-time sends, segments, Liquid tags, and how a flow plan becomes a build sheet the team sets up in Customer.io. Customer.io is the platform for all of Fluid's peptide brands, so this always pairs with the RUO peptide rules. Use it ANY time a client's email platform is Customer.io (memory.md "Email platform: Customer.io", or the tools report platform "Customer.io"), for reports, strategy, flows, segments or pushing emails.
status: ready
---

# Fluid on Customer.io

Most of Fluid's system was built on Klaviyo. Some clients, including **every peptide brand**, run on Customer.io instead. The strategy, copy and design skills stay the same; this skill covers what changes when the platform is Customer.io. Peptide brands are research-use-only, so `../fluid-email-copywriter/references/ruo-peptides.md` and `../../../knowledge/sops/ruo-peptide-compliance-sop.md` apply to everything here too.

## Words that change

| Klaviyo / Fluid word | Customer.io word | In the API |
|---|---|---|
| Flow | Campaign (in the app, now "automation") | `/v1/campaigns` |
| Campaign (one-off send) | Broadcast / one-time send ("newsletter") | `/v1/newsletters` |
| List / segment | Segment (data-driven or manual) | `/v1/segments` |
| Placed Order metric | the store's order **event** (often `placed_order`) | `/v1/activities?type=event` |
| `{% unsubscribe %}`, `{{ first_name }}` | `{% unsubscribe_url %}`, `{% manage_subscription_preferences_url %}`, `{{ customer.first_name }}` | Liquid |

In Slack and in client-facing writing, keep using Fluid's words (campaigns, flows) so reports read the same for every client.

## What the bot can do in Customer.io

- **Report** (`email_report`, `campaign_results`): live from Customer.io's App API. Sends, opens, clicks and conversions per one-time send and per automation, plus **attributed revenue**: the client's order events matched to the last email the person opened or clicked in the 5 days before ordering (the same approach as Fluid's peptide revenue dashboard, and Klaviyo's default window). Customer.io only guarantees 30 days of events, so revenue covers the last 30 days at most; say so when a range goes further back. No order event in the account means no revenue: ask the client to send `placed_order` events.
- **Push a finished design** (`push_to_customerio`): sliced and link-checked exactly like the Klaviyo push, images uploaded to Customer.io's file assets, then created as a **draft** one-time send with the subject, preview, sender and segments from the copy file. Re-pushing updates the same draft. It never sends, schedules or triggers anything (the code blocks those endpoints), and it only runs for clients whose `klaviyo_write` setting is `drafts` (that switch covers every platform).
- **Find audiences** (`find_audiences`): matches names against the client's Customer.io segments.
- **Onboarding audit**: senders, segments, automations, the order event and the last 30 days of results, saved to `research/customerio-audit-<date>.json`.

## What still needs a person in Customer.io

The API can't create automations or data-driven segments, and it shouldn't edit live ones. So:

- **Flows**: write the flow plan as usual (`../fluid-flow-strategist`), then add a **build sheet** per automation for whoever sets it up: trigger (event or segment entry), filters, each delay, each email (with its design's review link and subject/preview), exit conditions and conversion goal (`placed_order` within 5 days). Designs are built and approved through the normal review link; the team pastes the email HTML from the design's `build/customerio.html` (made by a push) into each automation email.
- **Segments**: translate Fluid's segmentation master sheet (`../../../knowledge/sops/segmentation-master.md`) into Customer.io conditions and hand over the spec: e.g. "Engaged 90" = has opened or clicked any email in the last 90 days OR performed `placed_order` in the last 90 days, AND is subscribed. Say which events the account actually has (from the audit) before relying on them.

## Before any send goes out (for the person sending)

- A **verified sender identity** that matches the persona; the push picks it from the copy's From line or falls back to the workspace default.
- The **subscription topic** the account uses (if it has a subscription center) and a layout or footer with the physical business address (the push warns when it can't find one: add `Business address: …` to `memory.md` or `compliance.md`).
- For peptide brands: the RUO compliance gate result is PASS and a person at Fluid approved it.

## Reporting format

Same Slack formats as every client (recap: "Email drove $X on Y orders across Z sends"; campaign: "<Campaign> did $X in sales with Y orders"). Customer.io gives no SMS or total-store revenue, so leave those out rather than estimating.
