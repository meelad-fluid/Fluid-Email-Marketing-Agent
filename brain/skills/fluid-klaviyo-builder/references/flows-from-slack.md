# Building a NEW flow in Klaviyo from Slack

The bot builds flows with one tool, `build_klaviyo_flow`, from a plan file you write. It creates **one new flow, in Draft**, plus a template for each email. That is the only thing it can do to flows.

## The one rule

**New flows only. Never touch an existing flow.**

- The write guard in `lib/klaviyo/write.ts` allows `POST /flows` (create) and nothing else. There is no update, turn-on, pause or delete path anywhere in Fluid's code.
- Every email and SMS in the request must be `status: "draft"`.
- The only allowed steps are emails, SMS, waits and conditional splits. No profile updates, webhooks, list changes or code.
- The tool reads the flow back after creating it and warns if anything isn't a draft.
- A plan that was already built is refused: its build record (`flows/<name>.klaviyo.json`) holds the Klaviyo link. Share that link.
- A second copy is made only when someone explicitly asks for one (`fresh_copy: true`), and it is a separate new draft.
- If someone asks to change, turn on, pause or delete a live flow, say that Fluid only builds new draft flows and that the change is made in Klaviyo.

## Before you build

1. **Designs are finished.** Every email in the flow has a design folder with a `Copy:` line in its README pointing to a copy file that has `SUBJECT (pick):`, `PREVIEW (pick):` and, if approved, `From:`. Plain-text emails (a founder note) are designs too.
2. **The flow strategy is the source.** Use `strategy/flow-strategy.md` (or the flow plan) for the trigger, timing, splits and exit conditions, and use the copy file for the order of the emails.
3. **Audiences and metrics exist.** List and segment names go through the same matching as `find_audiences`. Metric triggers use the account's metric names (Started Checkout, Added to Cart, Viewed Product, Placed Order, Active on Site, Checkout Started…).
4. **Peptide / RUO clients** get the copy and design guardrails on every email (the tool scans for prohibited wording too); no extra approval. Customer.io clients don't use this tool: give them the build sheet from fluid-customerio.

## The plan file (flows/<flow-name>.json)

```json
{
  "name": "Welcome Flow",
  "trigger": { "list": "Newsletter" },
  "steps": [
    { "split": [
        { "when": { "property": "stocking_up_on", "equals": "Matcha" }, "steps": [ { "email": "designs/welcome-flow-01-matcha" } ] },
        { "when": { "property": "stocking_up_on", "equals": "Cacao and baking" }, "steps": [ { "email": "designs/welcome-flow-01v2-cacao" } ] }
      ],
      "otherwise": [ { "email": "designs/welcome-flow-01v3-smoothie" } ] },
    { "wait": { "days": 1 } },
    { "email": "designs/welcome-flow-02-jeff-note" },
    { "wait": { "days": 2 } },
    { "sms": "Dolce: your 15% is still waiting… Reply STOP to opt out" },
    { "email": "designs/welcome-flow-03-reviews" }
  ],
  "exit_if_ordered": false
}
```

- **trigger:** one of `{ "list": "<name>" }`, `{ "segment": "<name>" }` or `{ "metric": "<metric name>" }`.
- **steps** run in order. A step is one of:
  - `{ "email": "<design folder>" }`
  - `{ "wait": { "days": N } }` or `{ "wait": { "hours": N } }`
  - `{ "sms": "<body>" }`
  - a split
- **Splits:** each `when` takes one of these conditions. Conditions are checked in order, and anyone who matches none of them gets `otherwise`.
  - `{ "property": "x", "equals": "y" }`
  - `{ "property": "x", "in": ["a", "b"] }`
  - `{ "property": "x", "is_set": true }`
  - `{ "in_audience": "<list or segment>" }`
- **Steps after a split run on every branch**, because Klaviyo branches never rejoin. The tool copies them onto each branch for you, so write them once.
- **exit_if_ordered: true** adds "has not placed an order since starting this flow". Use it for abandonment flows (checkout, cart, browse, site) and for any flow that sells to non-buyers.
- **Timing comes from the strategy.** Typical values:
  - Welcome #1 immediately
  - Abandoned checkout #1 at 1–4 hours
  - Browse at 2–4 hours
- **Sender:** the copy's `From:` label (the approved persona, e.g. "Hannah from Dolce"), with the account's default sender email.

## After building

The tool returns the Klaviyo link, whether it read back as Draft, and any **manual steps**.

**Reply:** "The [welcome flow](<link>) is in Klaviyo as a draft." Then one short line per manual step, then the status line.

**Common manual steps:**
- The exit filter, if Klaviyo refused it.
- Splits on a property that doesn't exist on profiles yet. They only route people once it does (e.g. after the new pop-up goes live).
- Turning the flow on. That's always a person in Klaviyo, after the client approves.

**Log it** in `memory.md`, dated, with the flow name and link.

## Errors

| Error | What to do |
|---|---|
| "needs the flows:write scope" | The client's Klaviyo key was made without flow access. Someone edits the key in Klaviyo → Settings → API keys (Flows: Full access) or reconnects a new key through the client's connect link. |
| "already built" | Share the existing link. Offer a fresh copy only if they want a second draft. |
| "No Klaviyo list or segment matches" / "No Klaviyo metric called" | Run find_audiences, or check the metric names in the error, and fix the plan. |
| "copy file needs SUBJECT (pick) and PREVIEW (pick)" | Fill those in the email's copy file first. |
| Rate limit | Klaviyo allows about 100 flow creates a day per account, so one flow at a time is plenty. |
