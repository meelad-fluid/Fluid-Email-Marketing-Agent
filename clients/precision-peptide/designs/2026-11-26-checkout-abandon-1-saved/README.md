# Abandoned Checkout Email #1 — Your checkout is saved (30 minutes after checkout_started)
Review link: fluid-email-marketing-agent-production.up.railway.app/r/_5EPvXIfCnDNcZtYs1GSdHcG
Status: draft · needs approval · goes live when the Abandoned Checkout flow is built in Customer.io
Copy: copy/abandonment-flows.md (Abandoned checkout, Email #1)
Subject: Your checkout is saved · Preview: Pick it up right where you stopped
From: Sarah from The Precision Peptide Company

Layout: ink logo bar → full-bleed evening-couch photo hero with headline, button and a tilted "Saved" sticker, rounded bottom corners → three-step progress track (done / next / if prescribed) → cream checkout card with folder tab and dynamic item row → "fine print, plainly" icon trio on midnight → rounded-top indigo close with ghost "Ask Our Team" + checkout buttons → footer
Style: cinematic dark photo hero bleeding into midnight sections, progress-bar device, folder-tab checkout card, stacked dual CTA

Notes
- `{% assign protocol = event.items[0].product_name %}` at the top. Every checkout button → {{event.checkout_url}}
- Checkout card is built in Customer.io as a `{% for item in event.items %}` loop (item.image_url, item.product_name, item.price). Semaglutide vial shown as the example image
- "Ask Our Team" → /contact
