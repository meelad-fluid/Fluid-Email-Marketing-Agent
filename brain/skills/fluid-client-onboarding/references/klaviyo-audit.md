# Klaviyo account audit (read-only)

Two ways in, either is fine:
- **Klaviyo connector (MCP)** authorized for the client's account in claude.ai connector settings. Confirm the account name/ID returned matches the client before reading anything.
- **The app's sync**: the client's private key added through their onboarding link (stored in Vault per client), then `npm run sync:klaviyo -- <slug>` fills the brain's `klaviyo_*` tables for that client only.

Never use another client's key or the reference key; never write, edit or send during onboarding.

## Keep it focused (Fluid's rule)

We are not auditing everything. Two questions only: **what has worked for this client, and what hasn't?**

1. **Flows: the top 6–10 by revenue** (last 60 days). For each: name, trigger, live/draft, revenue, recipients, revenue per recipient, and one line on what's working or broken. Skip the long tail. Note which of Fluid's core flows (welcome, site abandonment, browse abandonment, abandoned cart, post-purchase, winback) and the pop-up are missing.
2. **Campaigns: the last 30–60 days.** Rank by revenue per recipient. Pull the **best 3–5** and the **worst 3** with subject line, topic, offer, audience, open/click/RPR, and say what the winners share (topic, format, offer, timing) and what the losers share.
3. **A few account basics**: list size and engaged size, sign-up form submit rate and offer, average open and click rate (vs 35% / 0.5%), sends per week.

**Empty or new account** (no campaigns, no flows, or a brand-new list): say so in one line and switch to "starting from scratch" — the plan comes from the brief, the website and the avatars, and the first campaigns lean on Fluid's playbook rather than history.

Write the findings into section 1 of the Onboarding Doc, numbers with their base and window.
