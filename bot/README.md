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
