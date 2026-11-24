# Site Abandonment Flow: Customer.io Build Sheet

Status: emails approved by Nick on 2026-11-24 · automation not built yet (Customer.io is set up by hand)

**Why a build sheet:** Meta Molecule's email runs on Customer.io. Customer.io automations can't be created through the API, so a person sets this one up in the app from the steps below.

## Before you build

- **Customer.io connection:** no API key is connected yet
- **WooCommerce events needed:** page views, `product_viewed`, `added_to_cart`, `checkout_started`, `placed_order`
- **Email HTML:** push each approved design to Customer.io once the key is connected, then paste its HTML into the matching email below
- **Footer:** the full business street address still needs to go in the layout
- **SMS:** needs the SMS channel and an approved SMS disclosure; skip it until both exist

## Automation settings

- **Name:** Site Abandonment
- **Trigger:** page view event on the site
- **Trigger filters:**
  - Has not performed `product_viewed` in the same session or since the page view
  - Has not performed `added_to_cart` or `checkout_started`
  - Is subscribed to email
- **Exit conditions (exit as soon as any happens):**
  - Performs `product_viewed`
  - Performs `checkout_started`
  - Performs `placed_order`
- **Flow priority:** not currently in Browse Abandonment or Abandoned Checkout (Checkout beats Browse, Browse beats Site Abandonment)
- **Re-entry:** allow again after 7 days
- **Conversion goal:** `placed_order` within 5 days of an email
- **Offer:** none

## Steps

1. **Wait 2 hours**
2. **Email #1: Still comparing suppliers?**
   - Review link: [Site Abandonment #1](https://fluid-email-marketing-agent-production.up.railway.app/r/wwd1Hv_tx6AXP4Hoo_RXHlz5)
   - From: Meta Molecule
   - Subject: Still comparing suppliers?
   - Preview: Check our documentation first. That's what it's there for.
3. **SMS #1, sent right after Email #1** (only to people with SMS consent)
   - "Meta Molecule: Still comparing suppliers? Our COA library is public, no login needed: metamolecule.com/coas For research use only. Reply STOP to opt out."
   - 153 characters, 1 SMS
   - Status: still needs client approval
4. **Wait 1 day**
5. **Email #2: What researchers order first**
   - Review link: [Site Abandonment #2](https://fluid-email-marketing-agent-production.up.railway.app/r/SbvfTWuxKOIbaqDSyc7VKKJG)
   - From: Meta Molecule
   - Subject: What researchers order first
   - Preview: Three catalog staples. Ordered by 1 p.m. CT, they ship today.

## Before turning it on

- Compliance gate is PASS on both emails; a person at Fluid signs off before go-live
- Send a test of each email to the team inbox and check every link
- Confirm the sender identity "Meta Molecule" is verified in Customer.io
