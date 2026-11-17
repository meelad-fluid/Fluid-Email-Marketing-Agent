# The strategy doc

The doc follows the format of Fluid's reference strategies (EVO Labs, LEVL, Xtressé and the rest), so copywriters, designers and techs read it the way they always have. It adds two things: a short "Built From Your Data" section up front ("Built From Your Brand" when the client isn't in Hiro yet), and an Open Items list at the end.

## Contents

- [Layout](#layout)
- [Writing rules](#writing-rules)
- [Example email block](#example-email-block)
- [Creating the Google Doc](#creating-the-google-doc)

## Layout

Write it as markdown with exactly this heading structure. `#` is the title, `##` a section or flow, `###` an email, pop-up step or SMS.

```markdown
# [Brand] Email Flow Strategy

(Peptides only: the compliance block goes here, before anything else. See industries-replenishable.md.)

## Built From Your Data

- 5 to 7 bullets: the findings that shaped this strategy, each with its number, base
  and window. Same findings as the approved plan, in plain words for the client.

(Onboarding mode: this section is "## Built From Your Brand" instead: who the customer
is, the problems the strategy is built around, the hero product and why it's different,
the strategy's focus, and a one-line voice note. See onboarding-inputs.md.)

## Opt-in

### Step #1: Teaser + Collect Zero Party Data
**Headline:** Want 10% off?
**Question:** ...
- **Option #1:** ...
- **Option #2:** ...
- **Option #3:** ...

### Step #2: Collect Email
### Step #3: Collect SMS
### Step #4: Confirmation

## Offers

Quick reference table for the tech who builds the codes: where, code, value,
conditions. Every value marked "proposed for client approval" until confirmed.

## Welcome Flow (7 Emails + 2 SMS)

**Flow note:** Trigger ... Flow filter ... Split ...

### Email #1: Welcome Offer (Option #1 – [answer])
...fields...

**Conditional Split:** If they subscribed to SMS

### SMS #1
...fields...

### Email #1 v2: Welcome Offer (Option #2 – [answer])
### Email #1 v3: Welcome Offer (Option #3 – [answer])
### Email #2: Personal Note from the Founder
### Email #3: Customer Reviews
### Email #4: Best Seller Showcase
### Email #5: Upgrade offer for only 24 hours
### SMS #2

## Site Abandonment Flow (2 Emails)
## Browse Abandonment Flow (3 Emails + 1 SMS)
## Abandoned Checkout Flow (4 Emails + 1 SMS)
## Post-Purchase Flow (4 Emails)
## Winback Flow (2 Emails)
(Optional flows, only if approved: ## Replenishment Flow (2 Emails + 1 SMS), ## Sunset Flow (3 Emails))

## Flow Rules

## Open Items for the Client
```

**Counting, the house way:** a flow heading counts every email written in it, so Welcome is "7 Emails": Email #1's three versions plus Emails #2–#5. SMS go in the heading too ("+ 2 SMS"), which is what lets the converter check nothing went missing.

## Writing rules

- **Fields in this order, as bullets with bold labels:** Send Time, Email Topic, Design, Sending to, then **Goals:** with its bullets. Code and Value sit inside Goals as their own bold-label bullets, right after the line that introduces the offer, as the reference docs do.
- **Send Time** is relative: "Immediately after sign up", "4hrs later", "1 day later", "Immediately after Email #2", "90 days after their first and only order".
- **Design:** `Yes` or `Plain text`, plus at most one short note ("Plain text. No images, no buttons, one inline text link"). No layouts, colors or block specs: Fluid's designers handle design.
- **Goals** run 4 to 10 bullets. Each names something specific: the product, the proof, the objection, the action. Use sub-bullets for the why, the way EVO Labs and LEVL do ("This single line does more for the taste objection than any claim we could make"). "Build trust" is a mood; "Answer 'will it match my skin?' with three reviews from customers in each shade range" is a goal.
- **Name products from the data.** Write "Bulk Organic Ceremonial Matcha, Bulk Organic Cacao Butter, Bulk Collagen Peptides Powder", not "best sellers". Where a choice came from a number, say so briefly in that bullet ("the most common first order, 160 of 2,234").
- **Pairing maps** in Post-Purchase #4 are one sub-bullet per starter: "Bought X: recommend Y, Z".
- **Dynamic content** is described, not coded: which block (viewed product, cart table, previous purchase), which fields, and what shows when it's empty.
- **SMS** carry Send Time and Goals; newer docs add a one-line copy direction in quotes. Peptide SMS end with the RUO line and STOP.
- **Placeholders** look like `[founder story — client to supply]`, and every one is listed again under Open Items.
- **Plain language.** The client reads this doc too.

## Example email block

```markdown
### Email #4: Best Seller Showcase

- **Send Time:** 1 day later
- **Email Topic:** Where most people start with [Brand]
- **Design:** Yes
- **Sending to:** New subscribers who have not purchased

**Goals:**

- Show the three products new customers start with most often
  - Bulk Organic Ceremonial Matcha: the most common first order (160 of 2,234 in the last 90 days)
  - Bulk Organic Cacao Butter (139 first orders)
  - Bulk Collagen Peptides Powder (114, plus 336 through the TikTok listing)
- Lead with matcha
  - 29% of first-time matcha buyers reorder it, the highest repeat rate of the three
- One line per product on what it's for and how people use it, so the first choice feels easy
- Remind them their welcome code is still active
  - **Code:** WELCOME10
  - **Value:** 10% off first order
```

## Creating the Google Doc

1. **Write the markdown** to `/home/claude/<client-slug>-flow-strategy.md`.

2. **Convert it:**
   ```bash
   python <skill-dir>/scripts/md_to_doc_html.py /home/claude/<client-slug>-flow-strategy.md \
     -o /home/claude/<client-slug>-flow-strategy.html
   ```
   The script handles headings, bold, italics, links, nested bullets, numbered lists, tables and horizontal rules. It prints the emails and SMS it counted under each flow and flags any flow whose count doesn't match its heading. Fix every flag, and check the totals against the approved plan, before uploading.

3. **Pick the folder.** If the person named a folder or gave a link, use that. Otherwise search Drive for a folder named after the client (`title contains '<client>' and mimeType = 'application/vnd.google-apps.folder'`). One clear match: save there. More than one: ask. None: save to their My Drive and say so.

4. **Create the doc** with Drive `create_file`:
   - `title`: `<Brand> Email Flow Strategy`
   - `contentMimeType`: `text/html`
   - `textContent`: the HTML file's contents
   - `parentId`: the folder from step 3, if any

   Drive converts the HTML into a native Google Doc. Don't set `disableConversionToGoogleType`.

5. **Verify.** Read it back with `read_file_content` (`includeComments: true`; without it the end of the text can be cut off). Check every flow heading and email heading made it in and the last section (Open Items) is there. If something's missing, say exactly what and fix it.

6. **Link it.** Give the doc's title as a link in the sentence that reports it.

Later changes ("make the winback 25%") go into the same doc, not a new one. Use the Google Docs editor connector if it's available; if it isn't, say the edit needs it rather than creating a second doc.
