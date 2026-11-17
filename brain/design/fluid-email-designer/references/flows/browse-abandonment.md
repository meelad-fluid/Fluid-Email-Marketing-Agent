# Browse abandonment flow

Built from Fluid's browse abandonment designs for Battle Sports, Exotic Ammo and Smile
Boutique NY, and Fluid's flow strategy template.

## Strategy spine

- **Trigger**: viewed a product. **Sending to**: window shoppers who didn't add to cart or
  start checkout. Exits on add to cart, checkout or purchase.
- **Three emails.** One SMS runs alongside email 1 (a simple reminder of what they viewed).
  It isn't designed here.

| # | When | Job | Template |
|---|---|---|---|
| 1 | +2 hrs | Reminder: the product they viewed, why it stands out, help choosing | `01-reminder.html` |
| 2 | +1 day | Reminder + proof: reviews of that product, the objection that stalls people (fit, sizing, legality), help | `02-social-proof.html` |
| 3 | +1 day | Incentive + expiry: the offer, their product, alternatives in the same category, the deadline | `03-incentive.html` |

The client's strategy doc decides the final count, timing and offer.

## The viewed product is the point

Every email is about the item they looked at, so the **Klaviyo dynamic block sits right
under the hero** (headline, subheadline, button first, then the block). Fluid's notes on
these blocks are part of the design; keep them in the `.dyn-n` line:

- "Pull image, product name, current price and link. Render only if the product has
  available inventory."
- Later emails: "Same block as email 1. In stock condition applies."
- Reviews block: "Pull reviews from the viewed product. Show first name and last initial.
  Suppress the block if the product has no reviews rather than substituting another
  product's reviews."
- Recommendations: "Other colorways, sizes or models of the same category. Exclude out of
  stock variants. Keep recommendations inside the category they viewed."

## The offer in this flow

Emails 1 and 2 lead with the product, not a discount (`data-offer="optional"`). If the
subscriber has an unused welcome code, it appears lower down as a reminder card ("Your 15%
still works"). Email 3 is the offer email: the offer is the headline, with the code pill
and the deadline above the fold.

## Block order

### 1. Reminder
1. Hero (stacked over a soft atmospheric background): logo, headline about the product they
   viewed ("You had eyes on this one"), subheadline (still in stock, same price), button.
2. **Dynamic viewed-product block** right under the hero.
3. "Why it stands out": a dynamic features block, or 3 benefit rows (`.ticks`).
4. Transition, then help choosing: category tiles (photo, title, one line, button), or a
   help split card ("Not sure which one fits? Ask the team").
5. Trust-icon row, footer.

### 2. Social proof
1. Hero (full-bleed lifestyle photo with scrim, rounded bottom): headline about proof or the
   objection ("Get the details before game day"), subheadline, button.
2. **Dynamic viewed-product block.**
3. Transition, then the objection that stalls people: guidance cards by category with a
   folder-tab label (`.tabcard`), one line each ("Runs snug. Go up a half size.").
4. Reviews: dynamic reviews block for the viewed product, or 2-3 review cards with the
   product overlapping one card.
5. Transition, then brand trust banner over an image (made in, years in business,
   guarantee).
6. Help banner ("Or just ask us") with two buttons: ask + back to the product.
7. Offer reminder card (only if there's an unused code), footer.

### 3. Incentive + expiry
1. Hero: offer headline ("Between us… your 5% off is still good" / big numerals), subheadline
   with the code and deadline, button, code pill.
2. **Dynamic viewed-product block**, then one review line under it.
3. "You might also like": dynamic recommendations from the same category.
4. Transition, then objection checklist over a photo (3 ticks: guarantee, quality, speed).
5. Expiry banner restating the code and deadline (`{{ expiration_date }}` style copy is fine),
   button.
6. Help line + ghost button, footer.

## Examples to view

In `references/examples/browse-abandonment/`, read top to bottom, left to right.

| File | Take from it |
|---|---|
| `bs-1-eyes-on-this-one.jpg` | The cleanest reminder: headline, sub, button, then the viewed-product block and a features block, over a blurred stadium |
| `bs-2-sizing-guide.jpg` | Objection-led email 2: folder-tab category cards, reviews block notes, "Or just ask us" help banner |
| `bs-3-try-another.jpg` | Email 3 with "You might also like" recommendations, offer card with the exclusion line, pricing banner |
| `ea-3-between-us.jpg` | Offer hero on a framed card over a texture photo; expiry bar with the deadline |
| `sb-2-real-smiles.jpg` | Speech-bubble review cards on a brand-color band; customer photo strip; brush-stroke decos |
| `sb-3-stays-between-us.jpg` | Objection checklist card overlapping a face photo |

What **not** to copy:
- The dynamic block above the headline (Exotic Ammo 1-2, Smile Boutique 1, not saved here).
  Headline, subheadline and button come first, then the block.
- The button under a tall dynamic block (Smile Boutique 2-3). Keep the first button in the
  hero so it lands above the fold.
- Hard straight edges between sections. Always add a transition.
