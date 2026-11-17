# Win-back flow

Built from Fluid's win-back designs for Battle Sports, Exotic Ammo and Xtressé, and Fluid's
flow strategy template.

## Strategy spine

- **Trigger**: last order, after the brand's usual time between orders (90 days by
  default). **Sending to**: customers who haven't ordered since. Exits on purchase.
- **Two emails** in Fluid's designs and strategy: a check-in, then the come-back offer.
  Longer win-backs (e.g. 4 emails) reuse these: extra check-ins use email 1's template,
  offer reminders and last calls use email 2's with the deadline copy.

| # | Job | Format | Template |
|---|---|---|---|
| 1 | Check in, not a hard sell: how's it going, what's new, tell us what you need | Plain text (default) or designed | `01a-check-in-plain.html` / `01b-check-in-designed.html` |
| 2 | Come-back offer: the offer, picked for them, what's new, where the code applies, the deadline | Designed | `02-come-back-offer.html` |

The strategy doc's `Design:` field picks 01a or 01b. Two of three brands sent email 1 as
plain text; Xtressé (a subscription product) sent a designed version with an offer.

## Block order

### 1a. Check-in, plain text
Logo, the letter, slim footer. Fluid's letters: "Quick check in." → what may have changed
since they bought (new colorways, sizes, rounds) → the small things people skip → one text
link → "Tell us X and we'll tell you exactly what to order. Reply and a real person
answers." An offer line is optional (Exotic Ammo closes with a code).

### 1b. Check-in, designed
1. Hero (stacked, lifestyle photo after the button): headline ("Restart your routine. Save
   up to 20%."), subheadline with the offer, button.
2. One brand-color review card overlapping the hero's bottom edge.
3. Short "it happens" copy (life got busy, the routine paused, why consistency matters).
4. Transition, then "why it was worth starting": 3 ticks over a lifestyle photo.
5. Proof (before/after, results) as guidance cards, then purchase options (`.options`) with
   a button.
6. Awards or trust row, footer.

### 2. Come-back offer
1. Hero (full-bleed photo with scrim, or overlay with the text to one side): headline with
   the offer ("15% on your next setup" / "Time to reload."), subheadline with the code and
   how long it lasts, exclusions in a small line, button, code pill.
2. "Picked for you": dynamic block from purchase history ("Exclude previously purchased
   items, out of stock items and the Order Protection SKU.").
3. "New since you last looked": dynamic block pulling New Arrivals (optional).
4. Transition, then "where your offer lands": a card naming the eligible categories when
   there's an exclusion (keep eligible and excluded products apart).
5. Purchase options or a program banner (subscription savings, reload program), button.
6. Review card, help line + ghost button.
7. Deadline line ("Your 10% runs out in 72 hours"), button, footer.

## Examples to view

In `references/examples/winback/`, read top to bottom, left to right.

| File | Take from it |
|---|---|
| `bs-1-check-in-plain.jpg` | Plain check-in: what's changed, the small things people skip, reply invite |
| `ea-1-check-in-plain.jpg` | Plain check-in that owns past shipping delays and closes with a soft code |
| `xt-1-restart-routine.jpg` | Designed check-in: brand-color review card, ticks over a photo, before/after, options card |
| `bs-2-next-setup.jpg` | Offer overlay hero with text to the right; "Picked for you" + "New since you last looked" blocks; where the 15% lands |
| `ea-2-time-to-reload.jpg` | Offer hero, purchase-history recommendations grid, program banner, 72-hour deadline |
| `xt-2-save-up-to-20.jpg` | Full-bleed portrait hero with the offer low on the image; stacked subscription savings |

What **not** to copy:
- Hard straight edges between sections (Exotic Ammo). Always add a transition.
- Product descriptions inside product blocks. Name and button only.
