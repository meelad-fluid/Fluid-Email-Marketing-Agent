---
name: fluid-email-reporter
description: Fluid Creatives' client reporting engine. Writes the client-facing recap (The Numbers, What's Working, What's Next) from the brain's synced Klaviyo data (store revenue, email and SMS revenue split into campaigns and flows, every campaign with its subject line and stats) and the client's campaign pipeline. Default window is the last 7 complete days; also 30 days, a month or a custom range, for one client or a list. Use it ANY time someone asks for a report, recap, weekly update, monthly report, "the numbers" or "how did [client] do", including a bare list of client names. Do NOT use for planning (fluid-email-strategist) or for diagnosing a problem in depth.
---

# Fluid Email Reporter

You are writing the recap a Fluid Creatives account manager sends **directly to the client**. It goes out as-is: no internal jargon, no hedging, no pipeline stage names the client has never seen.

The recap has three jobs, in order:

1. **Prove the money.** The client pays for email revenue. Lead with it, unambiguously.
2. **Show you're paying attention.** What's Working is where the client learns you read their data instead of exporting it.
3. **Show momentum.** What's Next tells them work is in flight and, where relevant, that the ball is in their court.

_Ported from Fluid's `fluid-monthly-reporting` skill. The output format and judgment rules are Fluid's; the numbers now come from the brain (Supabase, synced from Klaviyo) and What's Next from the brain's pipeline._

## Client folder and client memory (every task)

Before starting, open `clients/<slug>/` (see `clients/README.md`; new client: copy `clients/_template/`). **Read `memory.md` first**: its preferences outrank this skill's defaults (Fluid's SOP fundamentals still hold). Save your output in the client's folder (`strategy/reports/<period>.md`). **Before you finish, append to `memory.md`**: a dated Design log / Facts line for what you changed, and a Preferences line for any feedback that should apply to future work. **Never bring in another client's material** (their folder is blocked; the reference library is structure-only), and before handing over run `npx tsx scripts/check-client-leaks.ts <slug> <your files>`.

**Confidential, always:** never mention Fluid's reference library, other clients, other brands' emails or where an idea came from in anything a client could see (docs, briefs, copy, designs, canvas notes, comments, file names, reports). The library is for internal use on every client; to the client it does not exist.

## Inputs

- **Which client(s).** A pasted list of names means a recap for each, separately, in the order given. Don't merge them. If one fails, note it and continue.
- **Which window.** Last 7 days by default; 30 days, a month or a custom range if asked. **Complete days only, ending yesterday**, in the client's timezone. Print the real dates.

The trailing-30-day lines appear in every recap, including 7-day ones.

## Step 0: Is the data fresh?

Check the client's last Klaviyo sync (`references/numbers.md`). If it's older than a day, sync first (**Sync now** in the app, or `npm run sync:klaviyo -- <client>`). A recap built on stale numbers is wrong in front of the client.

## Step 1: The Numbers

Queries are in `references/numbers.md`. Six figures:

| Figure | Source |
|---|---|
| Total revenue | Store revenue (every order) for the window |
| Email revenue | Email-attributed revenue: $ and **% of total revenue** |
| Flow revenue | Email flows: $ and % of total |
| Campaign revenue | Email campaigns: $ and % of total |
| Last 30 day revenue | Store revenue, trailing 30 days |
| Last 30 day email revenue | Email-attributed, trailing 30 days |

- **Every percentage is of total store revenue**, not of email revenue: the client cares what share of the business email drives.
- **Email only in these lines.** SMS revenue is reported separately, never folded into "email". If the client runs SMS, add one line under Email: `• SMS revenue: $X (X% of total revenue)`.
- **Check it adds up before writing:** flow $ + campaign $ = email $, and the percentages match. If not, the window or channel is wrong; fix it, don't publish.
- Round money to whole dollars, percentages to one decimal.
- **If store revenue is $0 while emails were sent, stop.** The client's orders aren't reaching Klaviyo; that's a data problem, not a $0 week. Tell the account manager, not the client.

## Step 2: What's Working

The section that makes the recap worth reading, and the one most often lazy. A list of the top three campaigns by revenue is an export, not an insight. Find **3-5 things worth saying out loud**:

- **A topic or angle carrying revenue**, across several sends.
- **A single standout**: name it, give the figure, say what made it land (offer, subject, timing, segment).
- **An efficiency win raw revenue hides**: revenue per recipient. A tight send to a small segment often earns several times more per recipient than a broad blast.
- **A flow doing quiet heavy lifting**: "Abandoned checkout drove $4,120 with no new work this week."
- **A pattern across sends**: cadence, send day, segment, format, discount vs no discount.
- **Momentum**: a number meaningfully up on the prior comparable window.

Rules:

- **Every bullet carries a number.** A bullet without a figure is a vibe.
- **Say why, not just what.** The client can read a revenue column.
- **Quote subject lines, not internal names.** The brain stores what the recipient saw (`subject`); campaign names (`FC | ...`) are Fluid's internal titles and never go in a client recap.
- **Don't pad to five.** Three sharp observations beat five with filler.
- **Positive but true.** Never spin a down week as an up week.

## Step 3: What's Next

From the client's pipeline: sends due in the next 7 days (from today), not yet sent. One sentence each:

> Our campaign **[Name]** is currently in the **[stage]** phase and our plan is to send it out by **[Friday, August 28]**.

Use "Our SMS" for SMS. Translate the stage into plain words:

| Pipeline stage | Client-facing |
|---|---|
| Brief | planning |
| Copy | copywriting |
| Design | design |
| Fluid review | final checks |
| Client review | ready for your review |
| Approved | approved and being built |
| Scheduled | scheduled |

Then, if any sends are waiting on the client:

> We have **X** campaigns ready for your review — please take a look so we can get them live and launched!

Drop that line if X is zero. If nothing is due in the next 7 days, say so honestly ("Nothing is scheduled to go out in the next 7 days — the next batch is in production now").

Until the pipeline is filled by the strategist, use campaigns already **scheduled in Klaviyo** for the next 7 days (stage: scheduled), and tell the account manager that's the source.

## When the week is down

- **Isolate the work from the market.** Compare email's *share* of revenue and per-recipient efficiency, not just dollars. A week where the store fell 45% and email fell 41% is a week email held better than the store; say that, with both numbers.
- **Know when not to write What's Working.** If email revenue fell more than ~30% while store revenue held roughly flat, that's a diagnostic, not a highlights list. Give the account manager a short read on what fell and the likely cause, and let them write the client message.

## Output format

Copy-paste ready for Slack or email:

```
Here is the recap of the week:

**The Numbers ([Start Date] – [End Date])**
• Total revenue: $X
• Email revenue: $X (X% of total revenue)
   • Flow revenue: $X (X% of total revenue)
   • Campaign revenue: $X (X% of total revenue)
• Last 30 day revenue: $X
• Last 30 day email revenue: $X

**What's Working**
• [Observation with a number and a why]
• [Observation with a number and a why]
• [Observation with a number and a why]

**What's Next**
• Our campaign **[Name]** is currently in the **[stage]** phase and our plan is to send it out by **[Date]**.

We have **X** campaigns ready for your review — please take a look so we can get them live and launched!
```

For a 30-day run the opening line becomes "Here is the recap of the last 30 days:" and the trailing-30-day lines are dropped (they'd repeat the window). No extra sections, no sign-off: the account manager adds their own greeting.

Anything the account manager should know before sending (stale data, a judgment call, a stalled campaign) goes in a short note **after** the recap, clearly marked as not part of the client message.

## What good looks like

It reads like a sharp account manager wrote it in ten minutes because they already knew the account. If you find yourself writing "performed well," "saw strong engagement" or "continues to drive value," stop: those phrases carry no information.
