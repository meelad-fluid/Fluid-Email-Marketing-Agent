# The brain

Everything the agent knows, as skills: one per part of the job, each a self-contained package (`SKILL.md` + references) in the same format as Claude skills, so the same files run inside the app and in Claude Code / claude.ai. Skills read client data from Supabase (synced from Klaviyo) and the shared knowledge below.

| Part | Skill | Status | Source |
|---|---|---|---|
| Onboarding | [`skills/fluid-client-onboarding`](skills/fluid-client-onboarding/SKILL.md) | Ready | Fluid's onboarding process (2026-11-16): Klaviyo audit + website + research → Onboarding Doc (brand + avatars: problems, circumstances, desire, what keeps them up at night, where applicable) → first 2–3 campaign briefs. Runs before anything else for a new client |
| Strategy | [`skills/fluid-email-strategist`](skills/fluid-email-strategist/SKILL.md) | Ready | Ported from Fluid's `fluid-campaign-strategist` (playbook word for word); data from the brain instead of Hiro, output to the pipeline instead of ClickUp |
| Strategy (flows) | [`skills/fluid-flow-strategist`](skills/fluid-flow-strategist/SKILL.md) | Ready (Hiro-based) | Fluid's `flow-strategy` skill as-is (from Mohdi Docs, 2026-11-16): the system distilled from 31 strategies, replenishable + one-off versions; still reads Hiro, needs porting to the brain's Klaviyo/Shopify data |
| Copy | [`skills/fluid-email-copywriter`](skills/fluid-email-copywriter/SKILL.md) | Ready | Fluid's Copywriting SOP (2026-11-16): customer research (website interrogation, voice spec, avatar) → brief vs avatar → framework (4Ps/AIDA/BAB/PAS) → designed or plain-text copy; reads the reference library's verbatim copy |
| Design | [`design/fluid-email-designer`](design/fluid-email-designer/SKILL.md) | Ready (flows) | Fluid's `fluid-email-designer` skill, extended with browse, cart/checkout, post-purchase and win-back; campaign templates next |
| Implementation | [`skills/fluid-klaviyo-builder`](skills/fluid-klaviyo-builder/SKILL.md) | Draft | Verified Klaviyo reads + the approval gate; to merge with Fluid's existing Klaviyo agent |
| Reporting | [`skills/fluid-email-reporter`](skills/fluid-email-reporter/SKILL.md) | Ready | Ported from Fluid's `fluid-monthly-reporting` (format and rules word for word); numbers from the brain instead of Hiro |

## How they hand off

```
strategist ──brief──▶ copywriter ──copy per template slot──▶ designer ──approved design──▶ klaviyo-builder
     ▲                                                                                          │
     └──────────────── reporter reads the results the next sync brings in ◀──────────────────────┘
```

- The **strategist** writes one brief per send (`skills/fluid-email-strategist/references/brief.md`) into the pipeline.
- The **copywriter** writes to the exact `{{SLOTS}}` of the designer's template, so the designer uses the copy as written.
- The **designer** builds from Fluid's templates in the client's brand kit; the design engine slices and checks it.
- The **builder** creates drafts in Klaviyo and schedules only from an approved record (enforced in the database).
- The **reporter** writes the client recap from the synced results and the pipeline.

## Per-client folders and memory

Every client has `clients/<slug>/` (onboarding, brand kit + assets, research, strategy, copy, designs) and its own `memory.md` — preferences, a log of every design change, verified facts. Every skill reads it first and appends to it before finishing. Rules: `../clients/README.md`.

## Shared knowledge

| Path | What |
|---|---|
| `flows/` | Fluid's flow system v2 (2026-11-16): the 4-step pop-up, six core flows + optional Replenishment/Sunset, offer ladder and rules; each email carries Topic / Design / Sending to / Offer / Goals for both versions and links its design template. Read `flows/OVERVIEW.md`. Built by `npm run brain:flows`, pushed to Supabase `flow_frameworks` by `npm run brain:flows:push`. The older Dolce-Klaviyo frameworks are in `flows/archive/` |
| `../knowledge/reference-library.md` | The reference library: Fluid's past emails in Supabase `reference_emails`, tagged by flow / campaign type / industry, with teardown, verbatim copy and SOP check. How every agent pulls references |
| `design/fluid-email-designer/` | Design rules, flow blueprints, templates, example sheets |
| `../knowledge/sops/copywriting-sop.md` | Fluid's Copywriting SOP, verbatim: customer understanding, website interrogation, voice spec, avatar questions, briefs, designed vs plain text, the four frameworks |
| `../knowledge/sops/strategy-sop.md` | Fluid's Strategy SOP: 80/20 value/sales mix, 12–20 campaigns/mo, 2–4/wk, 5 SMS, six core flows, 35% open / 0.5% click, 20/20/40 revenue aspirations |
| `../knowledge/flow-strategies/` | 28 real Fluid flow strategy docs (pop-up + per-email topic, goals, creative direction) converted to text; the bar for briefs |
| `../knowledge/` | The Design SOP, design playbook, reference email teardowns |
| `../lib/onboarding/questions.ts` | The client profile questions every skill reads |

## Packaging for claude.ai

`npm run brain:package` writes one `.zip` per skill to `out/skills/`, ready to upload to claude.ai (Settings → Capabilities → Skills) so the team can use the same skills there.
