# Post-purchase flow

Built from Fluid's post-purchase designs for Battle Sports, Exotic Ammo and Raw Pigments,
and Fluid's flow strategy template.

## Strategy spine

- **Trigger**: placed order. **Sending to**: new customers. Exits on a new order.
- **Four emails.** Two are plain text from the founder or team, two are designed.

| # | When | Job | Format | Template |
|---|---|---|---|---|
| 1 | +5 min | Thank you: thank them for trusting the brand, what happens next (shipping time), support, track the order | Plain text | `01-thank-you-plain.html` |
| 2 | +1 day | Get ready: how to use the product, their order, care and setup guides, optional next-order offer | Designed | `02-get-ready.html` |
| 3 | +7-10 days | Check in: how's it going, shipping honesty, reply to a real person | Plain text | `03-check-in-plain.html` |
| 4 | +2 days | Complete the kit: what pairs with what they bought, recommendations, review request, next-order offer | Designed | `04-complete-the-kit.html` |

The client's strategy doc decides the final count, timing and offer. Its `Design:` field
decides plain text vs designed.

## Plain-text emails

Emails 1 and 3 read like a personal note: logo, the letter, a text link, sign-off, slim
footer. No hero, no buttons, no images in the body. Fluid's letters:
- Open with the point ("Order is in. Your confirmation is already in your inbox, so this
  is not that. This is just us saying thanks.").
- Say what happens next in plain numbers ("Most orders ship in 7 to 10 business days").
- Invite a reply ("A real person reads it.") and give one or two text links (contact, order
  status, community).
- Battle Sports adds a **conditional line for returning customers** ("And thanks for coming
  back."). Mark it in the letter so it's built as a Klaviyo conditional.

## Block order

### 2. Get ready (designed)
1. Hero (lifestyle photo after the button, rounded bottom): headline ("It is here. Get it
   ready." / "Your launcher's on the way. Let's get you ready."), subheadline, button. If the
   doc has a next-order offer, it goes in the subheadline with the code (Exotic Ammo:
   "plus 10% off your next order with SECOND10").
2. "Your order": dynamic block of the purchased items (`data-offer="optional"` otherwise).
3. Transition, then the guides: 3-4 guidance cards by category or task, each an image with a
   folder-tab label or a title, one line, and a button ("Read the guide", "Safety tips").
4. Optional: a pro or artist spotlight (Raw Pigments) with a technique tip.
5. Transition, then support banner over an image ("If something is off"): the returns and
   damage policy in one or two lines, contact + guides buttons.
6. Footer.

### 4. Complete the kit (designed)
1. Hero (stacked, product collage after the button): headline ("Complete your kit." /
   "Finish the setup"), subheadline with the next-order offer, button, code pill.
2. "Recommended for you": dynamic block from purchase history ("Exclude items already
   purchased, out of stock items and the Order Protection SKU. Match color and size where
   the data supports it.").
3. Transition, then category tiles of what pairs with it (photo, title, one line, button),
   or featured products with the name in big type behind each (name + button).
4. Review request split card ("Already out there? Tell us how it's going." + button).
5. Closing offer banner (code + button), footer.

## Examples to view

In `references/examples/post-purchase/`, read top to bottom, left to right.

| File | Take from it |
|---|---|
| `bs-1-thanks-plain.jpg` | Plain thank-you with the conditional returning-customer line and support links |
| `ea-3-check-in-plain.jpg` | Plain one-week check-in: honest about shipping, reply invite, order status link |
| `bs-2-get-it-ready.jpg` | "Your order" dynamic block, folder-tab care guides by category, support banner |
| `ea-2-get-you-ready.jpg` | Next-order code in the hero subheadline; guide split cards; recommendations block on a brand band |
| `rp-2-master-the-medium.jpg` | Pro spotlight with a technique tip, product name type behind the bottles |
| `bs-4-finish-the-setup.jpg` | Short add-on email: recommended block, "same color all the way down" banner |
| `ea-4-complete-your-kit.jpg` | Category tiles over photos, review request split card, closing offer |
| `rp-4-every-hue.jpg` | Expand-the-range email: code pill above the fold, atmospheric product shots |

What **not** to copy:
- Hard straight edges between sections (Exotic Ammo, Raw Pigments). Always add a transition.
- Descriptions under product shots that are acting as product blocks. Name and button only;
  guide cards and category tiles keep their one line.
- Reusing the same product images in emails 2 and 4.
