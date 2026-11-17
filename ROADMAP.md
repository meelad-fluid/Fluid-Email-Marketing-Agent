# Fluid Email Agent: Build Map

One app that runs a client's entire email program (strategy, copy, design, Klaviyo build, reporting) and **never sends anything without the client's approval**.

Stack: **GitHub** (code + knowledge/skills as markdown) → **Vercel** (Next.js app + cron jobs) → **Supabase** (database, file storage, auth). Connected per client to **Klaviyo** and **Shopify** by API.

---

## 1. How it's organized

**One app, one workspace per client.** Every client gets their own profile, brand assets, Klaviyo/Shopify keys, calendar and reports. Their data is walled off from other clients in the database (row-level security). We don't deploy a separate copy per client: one codebase means a fix or a new skill reaches every client at once.

```
                         ┌──────────────────────────────┐
                         │      CLIENT WORKSPACE         │
                         │  Profile · Brand kit · Assets │
                         │  Klaviyo key · Shopify key    │
                         └──────────────┬───────────────┘
                                        │ loads
   ┌──────────┐   ┌──────────┐   ┌──────▼───┐   ┌────────────────┐   ┌───────────┐
   │ STRATEGY │ → │   COPY   │ → │  DESIGN  │ → │ IMPLEMENTATION │ → │ REPORTING │
   │ calendar │   │ subject, │   │ branded  │   │ Klaviyo build  │   │ weekly    │
   │ angles,  │   │ headline,│   │ sliced   │   │ (draft only)   │   │ report,   │
   │ flows    │   │ body,SMS │   │ images   │   │                │   │ learnings │
   └──────────┘   └──────────┘   └──────────┘   └───────┬────────┘   └─────┬─────┘
                                                        │                  │
                                 ┌──────────────────────▼──┐               │
                                 │   APPROVAL GATE (code)   │◄── feeds the next
                                 │ client clicks Approve →  │    month's strategy
                                 │ only then schedule/live  │
                                 └──────────────────────────┘
```

### The approval gate
Enforced in code, not in the prompt. Every piece of work moves through:

`draft → internal_review (Fluid) → client_review → approved → scheduled/live`

- The agent's Klaviyo key can only **create drafts**. Scheduling a campaign or setting a flow live is a separate server action that only runs from an `approved` record, triggered by a human clicking Approve.
- Every approval records who, when, and the exact version approved. If anything changes after approval, it drops back to `client_review`.
- Client comments on a rejection are saved to the client brain as preferences ("no emojis", "less pink").

### Skills = the bot's memory
Each component has its own skills: markdown files in `skills/<component>/<skill>/SKILL.md`, same format as Claude skills, so the team can also use them in Claude Code. They're versioned in GitHub and synced to Supabase; every build records which skill versions it used. Shared knowledge (SOPs, playbooks, reference emails) lives in `knowledge/` (see `knowledge/README.md` for the 3-layer brain).

---

## 2. The client profile

What each client gets when onboarded:

| Section | Contents | Status |
|---|---|---|
| **Questionnaire** | Brand, audience, offers, rules, goals | Placeholder questions now (`skills/_onboarding/questions.md`), real ones later |
| **Brand kit** | Logo(s), colors, fonts, button style, photo style, locked footer | Auto-pulled from their site/Shopify, then confirmed by a human |
| **Asset library** | Product shots, lifestyle photos, icons, past emails, reference emails | Supabase Storage, tagged (`logo`, `product`, `lifestyle`, `icon`, `past_email`, `reference`) and linked to Shopify products |
| **Voice** | Voice guide, example copy, banned words/claims, required disclaimers | From questionnaire + past emails |
| **Connections** | Klaviyo private key, Shopify app token | Stored encrypted (Supabase Vault) |
| **Preferences** | Learned from every approval comment | Grows automatically |

---

## 3. The five components and their skills

### A. DESIGN (build first)
Turns a brief into an on-brand, SOP-compliant email, delivered as compressed image slices.

**How it works:** the AI never draws pixels directly. It writes an **email spec** (recipe + list of sections + copy + which assets to use). Our code renders that spec with the client's brand kit into a 600px email (at 2x), takes a screenshot, runs the SOP checks, slices it at section boundaries, compresses each slice, and writes alt text. Because we built the sections ourselves, we know exactly where to slice and where each slice links: no guessing.

| Skill | Job |
|---|---|
| `brand-kit-extraction` | Pull colors, fonts, logo, button style, photo style from the client's site, Shopify and past emails into a draft brand kit |
| `reference-analysis` | Tear down a reference or past email (headline / sub / offer / button / fold / sections) and store it |
| `layout-composition` | Pick the campaign recipe and section order for a brief; output the email spec |
| `section-library` | The building blocks (hero, bridge icons, product cards, reviews, comparison table, offer recap, footer…) and when to use each |
| `asset-selection` | Choose the right product/lifestyle images from the client's library for each section |
| `design-qa` | Run the SOP checklist: code checks (CTA in fold, CTA per section, compression, alt text) + AI visual review |
| `slice-and-export` | Cut, compress (≥70%), link and alt-text each slice; package for Klaviyo |
| `design-revision` | Apply client/Fluid feedback to a design and save the preference |
| `flow-design-system` | Keep every email in a flow visually consistent (same header, footer, buttons, cards) |

### B. STRATEGY
Builds and manages the campaign calendar and flow plan.

| Skill | Job |
|---|---|
| `account-audit` | Read Klaviyo + Shopify: what flows exist, what's missing, list health, revenue split |
| `campaign-calendar` | Monthly calendar: dates, angles, campaign type, segment, offer, email + SMS |
| `angle-selection` | Pick the 3–5 angles the month runs on from past winners + learnings |
| `flow-architecture` | Plan the core flows (welcome, abandoned cart/checkout/browse, post-purchase, winback, sunset) with triggers, filters, splits |
| `segmentation` | Define segments (engaged 30/60/90, VIP, first-time vs repeat, by product) |
| `promo-planning` | Holiday and sale calendar, offer ladders, discount guardrails |
| `testing-roadmap` | What to A/B test each month and how to judge it |

### C. COPY
Writes everything in the client's voice, to the SOP structure.

| Skill | Job |
|---|---|
| `voice-capture` | Build the voice guide from questionnaire, site and past emails |
| `subject-preview` | Subject line + preview text options, using past tested winners |
| `headline-writing` | Headline by type (pain, offer, contrarian, question, social proof…) |
| `email-body` | Body copy per recipe: short paragraphs, sets of three, CTA per section |
| `cta-writing` | Action + solution button copy, varied per section |
| `sms-copy` | SMS for campaigns and flows, with compliance |
| `compliance-check` | Banned claims, required disclaimers, offer exclusions |

### D. IMPLEMENTATION (existing Fluid agent, to be ported in)
Builds approved work inside Klaviyo.

| Skill | Job |
|---|---|
| `template-upload` | Upload slices to Klaviyo Images, build the template with per-slice links, zero padding |
| `campaign-build` | Create the campaign draft with audience, subject, preview, send time |
| `flow-build` | Create flows with triggers, profile filters, conditional splits, time delays |
| `segment-build` | Create segments from the strategy definitions |
| `go-live` | **Only callable from an approved record.** Schedule the campaign / set the flow live |

### E. REPORTING
| Skill | Job |
|---|---|
| `data-sync` | Nightly pull from Klaviyo reporting API + Shopify orders into Supabase |
| `weekly-report` | The Numbers · What's Working · What's Next, sent to the brand every week |
| `insights` | Find patterns per client and across clients ("what's working" table) |
| `deliverability-watch` | Flag spam rates, bounces, unsubscribe spikes |
| `report-delivery` | Send the report (email / Slack / client portal link) |

---

## 4. Build order

Each phase ends with something you can use and judge before moving on.

### Phase 0: Foundation
- Git repo, Next.js app, Supabase project, Vercel project
- Database: clients, profile questionnaire, brand kits, assets, work items, approvals
- Client profile screens: questionnaire (placeholders), brand kit, asset upload
- **Done when:** you can create a client, fill the placeholder questions and upload their images.

### Phase 1: Design engine
1. Email spec format + section library rendered from a brand kit
2. Render → screenshot → slice → compress pipeline
3. Automated SOP checks (design-qa)
4. AI composition: brief → spec (layout-composition, asset-selection)
5. AI visual review + auto-fix loop
6. Brand kit extraction from site/Shopify
7. Design review screen with comments → revisions
- **Done when:** given a brief and a client, the agent produces an email you'd send without touching it, 4 out of 5 times.

### Phase 2: Strategy
Klaviyo + Shopify connections and audit → monthly calendar screen → flow plans. Port the logic from the existing `fluid-campaign-strategist` skill (minus Hiro: data comes from our own Klaviyo/Shopify sync).

### Phase 3: Copy
Voice capture → copy skills plugged into the design engine's spec step (so Phase 1's placeholder copy becomes real copy).

### Phase 4: Implementation
Port the existing Klaviyo implementation + flow-building agent and the slicing agent from Fluid's GitHub/Vercel/Supabase. Wire the approval gate and client approval portal.

### Phase 5: Reporting
Nightly sync, weekly report generation and delivery, cross-client learnings. Port from `fluid-monthly-reporting`.

### Phase 6: Hardening
Rate limits, retries, error alerts, audit log, cost tracking per client.

---

## 5. Open questions

- Real onboarding questions (placeholders for now)
- Where clients approve: client portal link, Slack Connect, or both
- Access to the existing implementation and slicing agents' repos (GitHub, Supabase, Vercel connections in Claude Code currently fail to connect)
- Report delivery channel and day of week
