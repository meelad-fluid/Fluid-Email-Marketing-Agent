# Welcome flow

Built from Fluid's welcome strategies (Raw Pigments, Battle Sports, RevX Wellness) and
designs (Raw Pigments, Exotic Ammo, Battle Sports, El Viejon).

## Strategy spine

- **Trigger**: joins the list through the signup form. **Sending to**: subscribers who
  haven't purchased. Exits on purchase.
- **Five emails.** A doc that says "7 emails" counts the email 1 versions separately
  (3 versions of email 1 + emails 2-5).
- SMS messages run alongside emails 1 and 5. They aren't designed here.

| # | When | Job | Template |
|---|---|---|---|
| 1 | Immediately | Welcome, deliver the code, the mission, the benefit they picked in the pop-up, best sellers for that pick | `01-welcome-offer.html` |
| 2 | +4 hrs or +1 day | Founder or team note: why the brand exists, quality promise, invite replies, code reminder | `02a-founder-note-plain.html` or `02b-founder-note-letter.html` |
| 3 | +1 day | Trust: real reviews tied to the benefits, discount reminder | `03-reviews.html` |
| 4 | +1 day | Make the first choice easy: where to start, best sellers, objections | `04-best-sellers.html` |
| 5 | +1-2 days | Close: upgraded offer for 24 hours, or last call on the original offer | `05-upgrade-offer.html` |

The client's strategy doc decides the final count, order and timing. This table is the
default when there's no doc. Email 2's format comes from the doc's `Design:` field:
`Plain text` → 02a, `Yes` → 02b.

## Email 1 versions

The pop-up asks an interest question, so email 1 has one version per answer (usually
2-3) plus a general version for people who skipped it. **Build one design, then swap the
copy per version** (and the product images if a version's copy names different
products). The layout never changes between versions.

## Block order by email

Component names refer to `templates/_base.html`.

### 1. Welcome offer
1. Hero (stacked over an atmospheric background): logo, headline, subheadline with the
   offer and their pick, button, code pill, hero product shot.
2. Transition, then the mission story: problem, the fix, 3 numbered benefits, closing line.
3. Transition, then the interest section: the benefit they chose, with an image
   breaking out of the section.
4. Transition, then 3 best sellers for that interest (pop-out product cards: name +
   button), then a "shop all" button.
5. Trust-icon row, footer.

### 2a. Founder note, plain text
Logo, then the letter: greeting, the story, the quality promise, the code line, an
invite to reply ("a real person reads these"), a text link, sign-off. Slim footer. No
hero, no buttons, no images in the body. It should read like a personal email.

### 2b. Founder note, branded letter
Same letter on the brand background with the brand's type, opening with
`{{ first_name }}`, closing with a signature block: founder photo cutout, name, title,
tagline. Trust-icon row and footer.

### 3. Reviews
1. Hero (full-bleed customer or lifestyle photo with scrim, rounded bottom): headline
   about proof, subheadline with the offer reminder, button, code pill.
2. One framing line.
3. 3-5 review cards (stars, quote, name). At least one has a product cutout overlapping
   the card.
4. Transition, then "why people switch": 3 short benefit bullets, then the code
   reminder and a button.
5. Transition, then 2 top products (pop-out cards), footer.

### 4. Best sellers / where to start
1. Hero (stacked): headline about where to start, subheadline with the offer, button,
   code pill, lineup or collage image.
2. Transition, then "how to choose": 2 guidance cards (image, title, one line each).
3. 2 featured products with the name in big type behind each (name + button).
4. Transition, then objection handling (price, value, sizes) over a behind-the-scenes
   or texture image.
5. Optional: the dynamic "Recommended for you" block.
6. Closing offer banner over an image (offer + button), footer.

### 5. Upgrade offer or last call
1. Hero: short headline, the offer as big numerals, deadline line, button, code pill,
   then product shot.
2. Transition, then "why now": urgency and scarcity copy.
3. Trust-icon row.
4. Closing offer banner restating the offer and deadline, button, footer.

## Examples to view

Example sheets are in `references/examples/welcome/`. Each tall email is cut into
columns, read top to bottom, left to right.

| File | Email | Take from it |
|---|---|---|
| `rp-1-welcome.jpg` | Raw Pigments 1 | Above-the-fold order with code pill; product name repeated behind each bottle |
| `bs-1-welcome.jpg` | Battle Sports 1 | Full-bleed hero with text overlay and rounded bottom; products popping out of cards; blurred stadium behind everything |
| `ev-2-founder-letter.jpg` | El Viejon 2 | Branded founder letter with signature photo |
| `rp-3-reviews.jpg` | Raw Pigments 3 | Reviews email: hero, review cards, why-switch bullets, mid-email offer |
| `bs-3-reviews.jpg` | Battle Sports 3 | Review cards with the product overlapping the card |
| `bs-4-best-sellers.jpg` | Battle Sports 4 | Where-to-start email with the Klaviyo dynamic block placeholder |
| `ea-5-upgrade.jpg` | Exotic Ammo 5 | Offer numerals as the hero; numbered steps; urgency banner |
| `rp-5-upgrade.jpg` | Raw Pigments 5 | Upgrade offer over a cinematic product shot |

What **not** to copy from the examples (older habits Fluid is moving away from):
- Hard straight edges between sections. Always add a transition.
- Descriptions and discount badges inside product blocks. Name and button only.
- Offer or button placed under a big product image (El Viejon 1, 4, 5) or missing from
  the hero (Exotic Ammo 3, 4; El Viejon 3). The offer goes above the fold.
