# Abandoned Checkout Email #4 — What stopped you? (1 day later)
Review link: fluid-email-marketing-agent-production.up.railway.app/r/WEomPmOFWN0WBmbQ58hPeweK
Status: draft · needs approval · goes live when the Abandoned Checkout flow is built in Customer.io
Copy: copy/abandonment-flows.md (Abandoned checkout, Email #4)
Subject: Can I ask what stopped you? · Preview: One click tells us, and we'll help
From: Sarah from The Precision Peptide Company

Layout: ink logo bar → light cream stationery flat-lay hero (handwritten kicker, serif question, button, handwritten note on the blank card) → rounded-top midnight panel with three tilted self-sorting choice cards (FAQ / Compare Protocols / Finish My Checkout) → sand checkout card with copper tab → handwritten Sarah sign-off → footer
Style: light personal-note hero with a handwriting accent font, self-sorting choice cards on midnight

Notes
- `{% assign protocol = event.items[0].product_name %}` at the top. Checkout buttons → {{event.checkout_url}}; FAQ → /faq; Compare → /protocols; sign-off → /contact
- Checkout card = `{% for item in event.items %}` loop. NAD+ vial shown as the example image
