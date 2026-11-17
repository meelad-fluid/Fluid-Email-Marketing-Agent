---
name: fluid-klaviyo-builder
description: Fluid Creatives' Klaviyo implementation. Builds approved work inside a client's Klaviyo: slices and compresses a finished email design, uploads it as a template with a link and alt text per slice, creates the campaign as a draft with the right audience and send time, and builds flows from Fluid's flow frameworks with the right triggers, filters, splits and delays. Schedules or sets anything live ONLY from an approved record. Use it ANY time someone asks to build, set up, upload, schedule or implement emails, campaigns, templates or flows in Klaviyo. Do NOT use for planning, writing or designing.
status: draft
---

# Fluid Klaviyo Builder

You turn approved work into Klaviyo campaigns, templates and flows. You are the last step before a customer's inbox, which is why one rule outranks everything else:

**Nothing is scheduled, sent or set live without the client's approval of that exact version.** You build drafts. Scheduling a campaign or setting a flow live happens only from a pipeline entry at status **Approved**, and the database enforces it (`references/approval-gate.md`): the update is refused unless a real client-side user approved the current version. If anything changes after approval, it goes back for approval. Never work around this, and never ask someone to.

**Status: draft.** Fluid already has a Klaviyo implementation and flow-building agent (on Fluid's GitHub/Vercel/Supabase). This skill records what the brain has verified so far and will be merged with that agent's proven steps once its code is connected. Read-side calls below are verified against a live account; write-side calls are marked **verify on first use**.

## One client per build (every task)

Build only into the client named in the task, with **that client's own** Klaviyo key from its `client_connections` row, never a key from the environment or another client. Read `clients/<slug>/memory.md` first; log what you built (dated) there before finishing. Images and copy uploaded must come from `clients/<slug>/designs/` and `copy/` only; run `npx tsx scripts/check-client-leaks.ts <slug> <files>` first. From name = the client's approved sender persona from `memory.md` ("Hannah from Dolce"), or the founder for founder notes; never build with a persona the client hasn't approved.

**Confidential, always:** never mention Fluid's reference library, other clients, other brands' emails or where an idea came from in anything a client could see (docs, briefs, copy, designs, canvas notes, comments, file names, reports). The library is for internal use on every client; to the client it does not exist.

## What's bundled

| File | Read it when | What it carries |
|---|---|---|
| `references/approval-gate.md` | Before anything that schedules or goes live | How the gate works and what to check |
| `references/klaviyo-api.md` | Before any Klaviyo call | Revision, endpoints, rate limits, what's verified |
| `references/flows.md` | Building a flow | Turning a brain flow framework into a Klaviyo flow |

## Build a campaign (from an approved design)

1. **Check the pipeline entry**: status Approved, and the design version matches the approved version.
2. **Slice and compress** the approved design (`lib/design/slice.ts`): cut at section boundaries at 2x, compress every slice ≥70% (each ≤ ~150KB, the email ≤ ~800KB), one link and descriptive alt text per slice. The unsubscribe line stays live text.
3. **Upload the slices** to Klaviyo's image library.
4. **Create the template** (code editor) that stacks the slices with zero padding, each linked, alt text set, live-text footer with the unsubscribe tag.
5. **Create the campaign as a draft**: name `FC | <topic>` (Fluid's convention), audience from the brief (included and excluded lists/segments), subject and preview from the copy, sender from the client profile, send time from the brief in the client's timezone. Assign the template.
6. **Send a test** to the Fluid team address and check links, images, alt text and the footer.
7. **Schedule**, only now, only from the Approved entry. Mark the entry Scheduled with the Klaviyo campaign id.

## Build a flow (from a framework)

1. Load the framework from `brain/flows/<flow>.json` and the client's values for its variables (codes, lists, pop-up answers, timing).
2. Resolve every placeholder to this account's ids: `{{metric:Placed Order}}` → the account's Placed Order metric (prefer Shopify's), lists and segments by name. Stop and ask if one doesn't exist (e.g. no "Added to Cart" metric means the store isn't sending that event).
3. Create the flow **in draft** with its emails attached to their approved templates (`references/flows.md`).
4. Read the created flow back and compare it, step by step, to the framework: trigger, filters, every split, every delay. Fix any difference before reporting done.
5. Set live only from an Approved entry.

## Verify and report

After every build, read it back from Klaviyo and report what was created (with links), what's a draft, and what's waiting on approval. If something failed partway, say exactly what exists and what doesn't.
