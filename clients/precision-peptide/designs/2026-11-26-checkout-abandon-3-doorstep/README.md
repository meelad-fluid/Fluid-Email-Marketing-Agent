# Abandoned Checkout Email #3 — What shows up at your door (1 day later)
Review link: fluid-email-marketing-agent-production.up.railway.app/r/QKlVLN3Wc1gt7DosJ9I_hJaF
Status: draft · needs approval · goes live when the Abandoned Checkout flow is built in Customer.io
Copy: copy/abandonment-flows.md (Abandoned checkout, Email #3) · SMS #2 sends right after
Subject: What the box looks like · Preview: Plain, discreet, and from a 503A pharmacy
From: Sarah from The Precision Peptide Company

Layout: ink logo bar → full-bleed dusk doorstep photo hero (plain navy box under a copper porch light) with big serif headline → tilted monospace shipping-label device overlapping the hero edge (TO: You / FROM: A 503A pharmacy / CONTENTS: Your business, barcode) → two-by-two checklist cards → sand checkout card with indigo folder tab → footer
Style: cinematic doorstep photo, a tilted shipping label as the idea, checklist grid on cream

Notes
- `{% assign protocol = event.items[0].product_name %}` at the top. Checkout buttons → {{event.checkout_url}}
- Checkout card = `{% for item in event.items %}` loop. Sermorelin vial shown as the example image
