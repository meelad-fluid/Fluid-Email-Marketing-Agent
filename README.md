# Fluid Email Agent

Runs a client's email program end to end (strategy, copy, design, Klaviyo build, reporting) and never sends anything without the client's approval. Plan and build order: **[ROADMAP.md](ROADMAP.md)**.

## Layout
| Path | What's there |
|---|---|
| `knowledge/` | Fluid brain: SOPs, design playbook, reference email teardowns |
| `skills/<component>/<skill>/SKILL.md` | What the agent knows how to do, per component |
| `skills/_onboarding/questions.md` | Client profile questionnaire (placeholders) |
| `lib/design/` | Design engine: spec + brand kit → render → slices → QA |
| `supabase/migrations/` | Database: clients, profile, brand kits, assets, work items, approval gate |
| `examples/` | Demo brand kits and email specs |
| `app/` | Next.js app (Vercel): `/admin` team view, `/onboard/<token>` client onboarding link |
| `lib/onboarding/questions.ts` | The onboarding questionnaire (drives the form, storage and what the agent reads) |
| `lib/store/` | Data access: Supabase in production, a local file store in development |

## Run it
Requires Node 22 (`~/.nvm/versions/node/v22.22.0/bin` on this machine).

```bash
npm install
npx playwright install chromium
npm run design:demo          # renders examples/specs/sale-25.json with both demo brand kits → out/
npm run dev                  # http://localhost:3000 → /admin (team view), design previews

# Without Supabase keys in .env.local, /admin runs in development mode and saves to out/dev-store.
```

`out/<kit>-<spec>/` contains `preview.html`, `full.png` (2x render), `slices/` (compressed slices + `template.html` for Klaviyo) and `report.json` (sizes, links, alt text, QA results).
