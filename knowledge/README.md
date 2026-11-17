# The Brain: how email knowledge is stored and used

The agent's knowledge has three layers. Every task (designing a campaign, building a flow, writing a report) loads all three, in this priority order:

```
┌─────────────────────────────────────────────────────────────┐
│ 3. CLIENT BRAIN            (one per client, private)         │
│    brand kit · voice · hard rules · products · preferences   │
│    learned from feedback · their own performance history     │
├─────────────────────────────────────────────────────────────┤
│ 2. LEARNINGS               (computed nightly, cross-client)  │
│    "what's working now": patterns ranked by lift vs each     │
│    client's own baseline. Patterns only, never content.      │
├─────────────────────────────────────────────────────────────┤
│ 1. FLUID BRAIN             (shared by every client)          │
│    SOPs · design playbook · campaign recipes · section       │
│    library · QA checklist · reference email library          │
└─────────────────────────────────────────────────────────────┘
```

**When they conflict:** client hard rules (legal, "never discount") > Fluid SOP > client preferences > learnings > reference patterns.
Example: the SOP says a CTA after every section, but a client says "max 3 buttons". For that client the preference wins, unless it breaks an SOP hard rule (like a missing CTA above the fold), in which case the agent flags it to Fluid.

---

## Layer 1: Fluid Brain (this folder)

| File | What it is |
|---|---|
| `sops/email-design-sop.md` | **The governing SOP.** Verbatim, versioned. |
| `email-design-playbook.md` | SOP + patterns from the reference emails: fold rules, section library, campaign recipes, QA checklist |
| `reference-email-teardowns.md` | 22 annotated reference emails (headline / sub / offer / button / sections) |
| `../brain/design/fluid-email-designer/` | **Fluid's email designer skill, mirrored exactly**: design rules, flow blueprints (welcome, site abandonment so far), HTML templates, example sheets. Edited in the skill, re-imported with `npm run brain:design` |
| `../brain/flows/` | Fluid's flow frameworks (triggers, filters, splits, delays), each email linked to its designer template |
| *(next)* `sops/*.md` | More SOPs as you write them: copywriting, flows, SMS, deliverability, reporting |

**Source of truth = these markdown files in git.** Your team edits a file, commits, and a sync job pushes it into Supabase. Every client uses the new version on their next run. Old versions are kept, so every email records which SOP version it was built under.

### How it gets into the agent
Loading everything into every prompt would be slow and expensive, so it's split:

1. **Always loaded (small):** SOP core rules (playbook §0) + the QA checklist. About 1.5k tokens.
2. **Loaded for the task:** the recipe for this campaign type, the matching section blocks, and the 3 most similar reference emails (found by meaning-based search).
3. **Enforced in code, not just in the prompt:** every checkable rule becomes an automated check that runs on the rendered email *before* it can go for approval:
   - CTA within 750px of the top → measured on the rendered layout
   - CTA at the end of every section → counted from the section structure
   - ≤ 2 sentences per paragraph, ≤ 3 points per section → parsed from the copy
   - Alt text on every image, unsubscribe link present → checked in the HTML
   - Each slice compressed by 70% or more → file sizes checked
   - Button has border + shadow + accent color → checked against the brand kit
   Rules that can't be checked by code (e.g. "headline names a real pain point") are scored by an AI reviewer against the checklist.

Because of point 3, the SOP can't be forgotten or skipped. An email that fails is fixed automatically and re-checked before anyone sees it.

---

## Layer 2: Learnings

A nightly job reads every sent campaign and flow email across all clients. Each is tagged with campaign type, headline type, offer presentation, sections used, CTA count, send time and industry, and scored against **that client's** normal performance. Output: the "what's working" table (pattern, lift, number of accounts, confidence).

**Learnings can be promoted into the Fluid Brain.** When a pattern wins consistently (e.g. "pain headline + comparison table beats offer headline for supplements, 7 of 9 accounts"), the agent proposes a playbook edit. A Fluid team member approves it, and it becomes part of the playbook for every client.

---

## Layer 3: Client Brain

Filled during onboarding, then kept current:
- **Brand kit:** colors, fonts, logo, button style (border/shadow per SOP), photography style, locked footer
- **Voice guide + examples**
- **Hard rules:** banned claims, required disclaimers, discount limits
- **Products:** synced from Shopify
- **Preferences learned from feedback:** every approval comment becomes a stored note ("no emojis", "prefers lifestyle photos")
- **Performance history:** from Klaviyo

---

## Supabase tables (draft)

```sql
-- Layer 1: Fluid Brain
knowledge_docs (id, slug, title, kind, version, body_md, active, created_at)
    -- kind: 'sop' | 'playbook' | 'recipe' | 'section' | 'checklist'
knowledge_chunks (id, doc_id, version, heading, body, embedding vector(1536))
    -- docs split by heading for search
design_rules (id, code, rule, source, severity, check_type, check_config, active)
    -- e.g. code='cta_above_fold', source='SOP', severity='block', check_type='layout',
    --      check_config={"max_px":750}
campaign_recipes (id, type, variant, fold_spec jsonb, sections jsonb, copy_skeleton, refs text[])
section_blocks (id, key, name, purpose, props_schema jsonb, template_ref)
reference_emails (id, brand, subject, campaign_type, teardown jsonb, image_path,
                  embedding vector(1536), performance jsonb)

-- Layer 2: Learnings
email_features (send_id, client_id, campaign_type, headline_type, offer_presentation,
                sections text[], cta_count, sent_at, industry)
email_results (send_id, rpr, ctr, cvr, unsub_rate, lift_vs_baseline jsonb)
pattern_insights (id, pattern, segment, lift, accounts_count, confidence, period, status)
    -- status: 'observed' | 'proposed_rule' | 'promoted'

-- Layer 3: Client Brain
clients, brand_kits, voice_guides, client_rules, client_products,
client_preferences (id, client_id, note, source_comment_id, strength, created_at)

-- Every build records what it was built with
builds (id, client_id, kind, knowledge_versions jsonb, qa_results jsonb, status)
```

Row-level security: Layer 1 is readable by every client's agent runs. Layer 3 is readable only by that client's runs. Layer 2 aggregates are readable by all, raw rows by none.
