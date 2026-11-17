# Clients

One folder per client. Everything Fluid makes or learns for a client lives in its folder, so clients never mix and any agent (strategist, copywriter, designer, builder) can pick up where the last one stopped.

```
clients/<slug>/
  README.md          the index: who they are, links, what's in flight
  memory.md          the client's own memory (read FIRST, append ALWAYS — see below)
  onboarding/        the onboarding form and anything they sent us, as received
  brand/
    brand-kit.md     fonts, colors, logo, buttons, photo style, voice — what designs use
    assets/          cleaned product cutouts, badges, logos, fonts we made or pulled
  research/          customer research doc (website interrogation, voice spec, avatars)
  strategy/          flow strategy, monthly campaign calendars, briefs
  copy/              one file per email: <date-or-flow>-<name>.md, final copy as approved
  designs/           one folder per email: design source, canvas link, change log
```

Start a new client with `clients/new-client.sh <slug> "<Name>"` (copies `_template/`, installs the isolation guard and the client's CLAUDE.md).

## Isolation: nothing crosses between clients

| Layer | What enforces it |
|---|---|
| **Local work (Claude Code)** | Open Claude Code **inside** `clients/<slug>/`. Its `.claude/settings.json` runs `_guard.py`, which blocks any read, write, search or shell command touching another client's folder (or sweeping all of `clients/`). Fluid's shared brain stays readable. |
| **Finished work** | `npx tsx scripts/check-client-leaks.ts <slug> <files>` fails if copy, a design or a report names another client or any brand in the reference library. Every skill runs it before handing over. |
| **App + database** | Every client table has `client_id` with row-level security (client logins see only their rows). The agents use the server key, so `npm run check:isolation` fails the build if any query on a client table isn't scoped to one client. |
| **Accounts** | Each client's Klaviyo/Shopify keys are stored per client (Vault); syncs, builds and reports only ever use that client's own key. Hiro: resolve the one client by id, never list-and-guess. |
| **Memory** | Client facts, preferences and design history live only in that client's `memory.md`. Claude's global memory holds Fluid-wide rules only. |

**Never tell a client about the library.** It's used for every client, internally only: no mention of it, of other clients, or of where an idea came from in anything a client can see.

**What is shared on purpose:** Fluid's brain (SOPs, skills, flow system) and the reference library. The library is **layout and structure inspiration only**: section order, visual devices, fold placement. Never another brand's copy, claims, product names, images, prices or results. Cross-client learning happens only as patterns ("price-tier cards beat a price paragraph"), never content.

## The client memory (`memory.md`)

Every client has its own memory, separate from Fluid's brain (what's true for every client) and from other clients. It is what makes the tenth email for a client better than the first.

**Read it first.** Before any strategy, copy or design work for a client, read their `memory.md`. Its rules outrank the general skills when they conflict (the client's taste wins over Fluid's defaults; Fluid's SOP rules like above-the-fold CTA still hold).

**Append every time.** Whenever something changes, add a dated line before ending the task:
- **Design log**: every design change — what was asked, by whom, what changed, the file/version. Never overwrite; append.
- **Preferences**: anything the client or Fluid team says they like or don't ("more color", "no white boxes behind products") as a standing rule, with the date and the email it came from.
- **Facts & decisions**: verified facts (prices, offers, claims), conflicts found and how they were resolved.
- **Assets**: what's in `brand/assets/` and how it was made, so it's reused instead of rebuilt.

A one-off fix to one email goes in the design log only. Feedback that will apply to the next email too also becomes a preference.

The Supabase app will mirror these folders per client workspace (`clients` row + storage); until then this folder is the source of truth.
