# Abandoned checkout and abandoned cart flows

Built from Fluid's abandoned checkout designs for Battle Sports and abandoned cart designs
for Exotic Ammo, and Fluid's flow strategy template.

**Cart and checkout use the same four emails.** The only difference is the dynamic block:
checkout pulls the checkout line items, cart pulls the Added to Cart items. Use these
templates for both and change only the block's note (and "Return to checkout" vs "Return to
cart" copy).

## Strategy spine

- **Trigger**: started checkout (checkout flow) or added to cart without starting checkout
  (cart flow). **Sending to**: people who didn't order. Exits on purchase.
- **Four emails and one SMS.** The SMS runs right after email 1 (simple reminder). It isn't
  designed here.

| # | When | Job | Template |
|---|---|---|---|
| 1 | +30 min | Simple reminder: their items, what's holding them up, a person to ask | `01-reminder.html` |
| 2 | +4 hrs to 1 day | Reminder + proof: their items, reviews, the fine print in plain words (returns, exchanges, guarantee) | `02-reviews.html` |
| 3 | +1 day | Mystery discount (or the flow's offer): the code, their items, how it works, the deadline | `03-mystery-discount.html` |
| 4 | +1 day | Last call: the offer expires tonight, their items, one tap to finish | `04-last-chance.html` |

The client's strategy doc decides the final count, timing and offer. No discount before
email 3; it protects margin for people who'd buy anyway.

## Their items are the point

Order in every email: **headline, subheadline, button, then the dynamic cart block** right
under the hero, so their items are visible the moment they open it. A hero photo may sit
after the button (inside the hero, rounded bottom), never between the headline and the
button.

Dynamic block notes from Fluid's designs (keep them in `.dyn-n`):
- "Pull product image, name, selected variant, quantity and current price. Suppress the
  Order Protection SKU from this block."
- Later emails: "Same block. Order Protection SKU suppressed."
- Cart flow: "Pulls the Added to Cart items (image, name, variant, quantity, price, cart
  link)."

## Block order

### 1. Reminder
1. Hero (lifestyle photo after the button, rounded bottom): logo, headline ("Finish gearing
   up"), subheadline ("Everything is still sitting there. Same size, same color."), button.
2. Section title ("In your cart"), **dynamic cart block**.
3. Help banner over an image ("Something holding you up?"): one line, then two buttons
   (talk to us + return to checkout).
4. Footer.

### 2. Reviews
1. Hero: headline that answers the main objection ("Get the right fit. Get locked in."),
   subheadline with the policy (swap within 90 days, free returns), button, photo after.
2. **Dynamic cart block.**
3. "What customers say": review cards, one with the product or customer photo overlapping.
4. "The fine print, plainly": 3 stacked icon rows (`.policy`): returns, exchanges,
   guarantee, one line each.
5. Help banner ("Still sizing it out?") with fit guide + return buttons, footer.

### 3. Mystery discount
1. Hero: offer headline ("We unlocked something for your cart" / "Here is 15% to finish
   it"), subheadline with the offer ("A mystery discount, up to 20% off") and deadline,
   code pill, button. Exclusions in a small line under the subheadline.
2. **Dynamic cart block.**
3. "How it works": one or two lines (enter the code, what it applies to).
4. Deadline banner ("48 hours, then it is gone") with the code pill and button.
5. Help line + ghost button, footer.

### 4. Last call
1. Hero: "Last call" headline, subheadline ("Your mystery discount expires tonight"),
   button, code pill.
2. **Dynamic cart block.**
3. Closing banner over an image ("One tap and it is done") with the code and button.
4. Footer.

## Examples to view

In `references/examples/abandoned-checkout/`, read top to bottom, left to right.

| File | Take from it |
|---|---|
| `bs-1-finish-gearing-up.jpg` | Photo hero with the rounded bottom, cart block straight after, help banner over a stadium |
| `bs-2-right-fit.jpg` | Objection headline, review cards over a dark photo, "The fine print, plainly" icon rows |
| `bs-3-15-to-finish.jpg` | Offer headline with a highlight box, exclusion line, "How it works", deadline banner |
| `bs-4-24-hours.jpg` | Short last-call email: left-aligned overlay hero, cart block, one-tap banner |
| `ea-3-mystery.jpg` | Mystery code as a dashed pill above the fold, cart block, code repeated at the end |
| `ea-4-last-call.jpg` | Two-color "Last call. Then it's gone." headline; button carries the code |

What **not** to copy:
- The cart block above the headline (Exotic Ammo 1-2, not saved here).
- Hard straight edges between sections (Exotic Ammo). Always add a transition.
- Product descriptions or discount badges inside product blocks.
