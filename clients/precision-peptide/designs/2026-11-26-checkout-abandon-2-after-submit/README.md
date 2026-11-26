# Abandoned Checkout Email #2 — What happens after you submit (1 day later)
Status: draft · needs approval · goes live when the Abandoned Checkout flow is built in Customer.io
Copy: copy/abandonment-flows.md (Abandoned checkout, Email #2)
Subject: What happens after you hit submit · Preview: A licensed clinician, within 24 hours
From: Sarah from The Precision Peptide Company

Layout: ink logo bar → full-bleed clinician-desk photo hero with italic question + big serif answer, tilted "Reviewed by" card → oversized-time vertical timeline (Now / 24h / Then) with dashed copper rail → midnight checkout card with copper folder tab and dynamic item row → cream help card with tilted speech bubble → footer
Style: dark photo hero fading into cream, big serif timestamps on a dashed rail, midnight checkout card

Notes
- `{% assign protocol = event.items[0].product_name %}` at the top. Checkout buttons → {{event.checkout_url}}; Talk to Us → /contact
- Checkout card = `{% for item in event.items %}` loop. Tirzepatide vial shown as the example image
