# Fluid Slack bot

@Fluid in a client's Slack channel runs strategy, copy, design and onboarding for **that client only**, using the same skills, client folders and memory as Claude Code. Reply in the thread to keep going.

## Run it
1. Create the Slack app from `bot/slack-manifest.json` at api.slack.com/apps → Create New App → From a manifest. Install it to the workspace.
2. In `.env.local` set:
   - `SLACK_BOT_TOKEN`: OAuth & Permissions → Bot User OAuth Token (`xoxb-…`)
   - `SLACK_APP_TOKEN`: Basic Information → App-Level Tokens, scope `connections:write` (`xapp-…`)
   - `SLACK_ADMIN_USER_IDS`: your Slack member ID(s), comma-separated
3. `npm run bot`. It runs on this machine (Socket Mode, no public URL).
4. In a client channel: `/invite @Fluid`, then `/fluid link dolce`, then `@Fluid …`.

## Security
| Gate | What it does |
|---|---|
| Who | Only full members of Fluid's own workspace. Guests, Slack Connect users and bots are refused. Optional allowlist: `SLACK_ALLOWED_USER_IDS`. |
| Where | Only channels linked to one client (`slack_channels`). DMs and unlinked channels get nothing. Only admins can link. |
| What | Rules plus a model screen refuse anything about other clients or brands, rankings across accounts, Fluid's internal business, the reference library, credentials, or attempts to override the rules. Refusals are neutral and never name anyone. |
| Sandbox | The agent runs in `clients/<folder>/`. It can read only that folder plus Fluid's skills and SOPs, write only that folder, and use no shell or database. It never sees credentials, because its environment is built from scratch. The client's guard hook also applies. |
| Out | Every reply and file is scanned for other brands' names and internal-only wording before posting. Anything flagged is held back. |
| Audit | Every request, refusal, block and link goes to `slack_audit`, with cost. |

Self-test: `npx tsx bot/test-security.ts` (add `--agent` to also test the sandbox, about $0.10).

## Running on a server (Railway)
The bot runs 24/7 on Railway from the GitHub repo `meelad-fluid/Fluid-Email-Marketing-Agent`.
- `Dockerfile` (Playwright image + git + python3), `bot/start.sh` (fresh clone of the repo at start, then the bot), `railway.json` (one instance, always restart, redeploy only when code changes, not client folders).
- Client folders sync through git: the bot pulls before each Slack request and commits + pushes that client's folder after it (`bot/git.ts`, on when `GIT_SYNC=1`).
- Railway variables: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_ADMIN_USER_IDS`, `GITHUB_TOKEN` (fine-grained, Contents read/write on this repo), `GITHUB_REPO=meelad-fluid/Fluid-Email-Marketing-Agent`.
- Working on a Mac too? `git pull` before, commit + push after, so the server and the Mac never drift.
- Only one copy of the bot may run: stop `npm run bot` on any Mac once the server is up.

## Design review links
Every design the bot makes or changes is published to a review link on this server: `<PUBLIC_URL>/r/<token>`. The page shows the real email at full quality with a mobile view and version history. People click to leave pinned comments, reply, resolve, and approve. "comments added" in the Slack thread makes the bot apply every open comment, publish a new version at the same link, and reply under each comment. Approvals update the design README's Status line (committed to GitHub) and post in the thread.
- Railway: Settings → Networking → **Generate Domain**, then set `PUBLIC_URL` to that https address. Railway sets `PORT` itself.
- Tables: design_reviews, design_review_versions, review_comments. Self-test: `npx tsx bot/test-review.ts` (local, port 8090).

## Onboarding a new client
`/fluid onboard Brand Name | brand.com` (admins). Creates the client in Supabase and its folder (from clients/_template, with the guard), saved to GitHub. Opens a private channel `#client-<slug>` with the person who ran the command (add others with `SLACK_TEAM_USER_IDS`, comma-separated), linked to that client, and posts the client's onboarding link (`<PUBLIC_URL>/onboard/<token>`, one use, 90 days).
When the client submits:
- answers go to profile_answers and onboarding/form-answers.md, and the Klaviyo key is checked live and stored in the vault
- the read-only Klaviyo audit and order data run, plus the reporting sync
- the agent runs the onboarding skill: brand kit, Onboarding Doc, month-1 plan (12 email + 5 SMS), flow plan (22 emails + 7 SMS)
- the doc links (`<PUBLIC_URL>/d/<token>`) are posted in the channel
Needs Slack scopes groups:write, groups:write.invites (in slack-manifest.json; reinstall the app after updating).

## Onboarding (in the client's own channel)
Run `/fluid onboard Brand Name | brand.com` **inside the client's internal channel** (admins). No channels are created: this channel is linked to the client (client + folder made if new) and gets a one-use upload link (Fluid team only, 14 days).
The page takes the client's onboarding doc as a PDF (plus brand guidelines or other files if you have them, saved to `onboarding/docs/`), an optional Klaviyo **or** Customer.io key (verified, stored in the vault; Customer.io's US/EU data center is detected), and notes. Saving starts the onboarding in the channel: account audit (Klaviyo or Customer.io, if connected), then the Onboarding Doc, month-1 plan and flow plan from the PDF and the website.
`/fluid onboard` with nothing after it, in a linked channel, gives a fresh upload link for that client.

## Customer.io clients (all peptide brands)
`lib/customerio/`: live reports with order-event revenue attribution (`report.ts`, same method as the peptide revenue dashboard), draft-only pushes of finished designs as one-time sends (`push.ts`, through the guard in `api.ts`: never send/schedule/trigger/edit automations). The bot picks Customer.io automatically for `email_report`, `campaign_results` and `find_audiences`, and has `push_to_customerio`. Playbook: `brain/skills/fluid-customerio/SKILL.md`.
