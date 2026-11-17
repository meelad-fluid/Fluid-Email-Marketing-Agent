# Site abandonment flow

Built from Fluid's site abandonment designs for Raw Pigments, Exotic Ammo, Battle Sports
and Xtressé. No strategy docs came with these, so count, timing and exit rules come from
the client's strategy doc.

## What this flow is for

Someone was on the site but **never opened a product**. There's nothing personal to show
them yet (that's browse abandonment), so the job is to welcome them back and make the
next step obvious: where to start, what most people buy, and what's holding them back.

**Two emails.**

| # | Job | Template |
|---|---|---|
| 1 | Help them find their way: who the brand is, the 2-3 ways people start, trust, help | `01-find-your-way.html` |
| 2 | Where everyone else starts: social proof, best sellers, why each one sells, how to buy, help | `02-best-sellers.html` |

## The offer in this flow

None of Fluid's site abandonment designs open with a discount. The hero's job is the
**hook**: explore, take the quiz, see the best sellers. When the subscriber has a welcome
code, it shows up near the end as a reminder ("Your 15% is still good"). Two of the four
brands had no offer at all.

So in these templates the code pill in the hero is optional (`data-offer="optional"`).
Keep it only if the strategy doc puts an offer up top. Headline, subheadline and button
still sit above the fold every time.

## Block order

### 1. Find your way
1. Hero (full-bleed photo with scrim, rounded bottom): logo, headline ("So, what caught
   your eye?"), subheadline (who the brand is, or a proof point), button.
2. One intro line, then **where to start**: either 3 category tiles (photo, title, one
   line, button) or outlined cards with products breaking out of the frame.
3. Transition, then trust: one review card in the brand color, plus an awards or proof
   row.
4. Transition, then help: a line of reassurance, an "ask the team" button and a primary
   button.
5. Offer reminder banner (only if there's a code), footer.

Optional, from the examples: a short education section (the problem, why the brand is
different, 3 numbered benefits) before "where to start". Raw Pigments leads with it.

### 2. Best sellers
1. Hero (stacked, product shot after the button): headline ("Start where everyone else
   starts"), subheadline with social proof (customer count, rating, clinical stat),
   button.
2. Best sellers right under the hero: the Klaviyo dynamic product block pulling the
   best-sellers collection, or static pop-out product cards (name + button).
3. "The reason each one sells": reason cards with the product breaking out of an
   outlined frame. These explain *why*, so they carry a line of text.
4. Transition, then how to buy: purchase options (one-time vs subscription), free
   shipping threshold or bundles, with a button. Then a "still deciding?" split card
   (photo + help line + button).
5. Offer reminder card (only if there's a code), footer.

**Use different product images in email 2 than in email 1.** Fluid's designs leave this
note for the designer; repeating the same shots makes the second email feel like a resend.

## Examples to view

In `references/examples/site-abandonment/`, read top to bottom, left to right.

| File | Take from it |
|---|---|
| `bs-1-three-ways.jpg` | "Three ways in": outlined cards with products breaking out; youth split card; offer reminder banner |
| `bs-2-best-sellers.jpg` | Dynamic best-sellers block right under the hero; reason cards; free shipping block; offer card |
| `ea-1-find-your-way.jpg` | Category tiles with photo backgrounds; trust strip; help buttons |
| `ea-2-crowd-favorites.jpg` | Best sellers email with "still deciding" help block and a soft code reminder |
| `xt-1-glad-you-found-us.jpg` | Photo hero with text low on the image; brand-color review card; awards row |
| `xt-2-best-place-to-begin.jpg` | Social-proof subheadline; purchase options list |
| `rp-1-define-your-standard.jpg` | Education-first version for a technical product |

What **not** to copy: hard straight edges between sections, descriptions and discount
badges inside product blocks, and the same product images in both emails.
