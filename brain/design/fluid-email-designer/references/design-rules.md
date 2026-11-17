# Fluid design rules

These apply to every designed email in every flow. They come straight from Fluid's
team. Where an older Fluid example breaks one of them, the rule wins; the team is moving
away from those habits.

## 0. Show it, don't write it (Fluid's lessons learned, 2026-11-16)

The biggest lesson from Fluid's past designs. It outranks every rule below.

- **More visuals.** Every section carries an image or graphic, not just text on a background.
- **Real static images built into the email**: product shots, lifestyle photos, and graphics made for the email (infographics, icon rows, comparison charts, step diagrams, before/after, ingredient call-outs, timelines). Text-only sections are a failure.
- **Explain with visuals, not paragraphs.** If a section explains something (how it works, why it's different, how to use it), turn it into a graphic: 3 icons with 3-word labels, a numbered step diagram, a vs-table. Copy that arrives as a paragraph gets broken into the visual, not pasted in.
- **Never a long block of text, anywhere.** Body copy max ~2 short lines per paragraph, max ~2 paragraphs per section, and every one sits next to or inside a visual. Plain-text emails are the only exception.
- **Every section has to look good on its own**: a designed moment (image, color field, graphic, transition), not a filler block. If a section can't be made to look good, cut it.

QA: scroll the render and ask of each section "is there a visual here doing the explaining?" Any section that is mostly text gets redesigned before anyone sees it.

## 1. Above the fold: headline, subheadline, offer, button

Every designed email opens with these four, in this order, before anything else of
substance. This is the part of the email that matters most; everything in it exists to
drive the click to the website.

- **Headline**: short and punchy, display font, usually 2-4 lines.
- **Subheadline**: 1-2 sentences. This is usually where the offer is stated.
- **Offer**: the code, discount or deal. Shown as a dashed code pill under the button or
  as bold text in the subheadline. Big offer numerals count as the headline when the
  offer *is* the message (upgrade and last-call emails).
- **Button**: one primary button.

The fold: keep the button within roughly the first **650px** of the 600px-wide email
(the preview script checks this). The hero image goes **behind** the text or **after**
the button, never between the headline and the button. A big product shot above the
offer pushes it out of view.

The logo sits above the headline, small.

**Exception: plain-text emails** (founder notes). They have no hero; the offer appears
as a line inside the letter.

**Flows where the offer is optional** (marked `data-offer="optional"`, e.g. site
abandonment): the hero leads with the flow's hook (explore, quiz, best sellers) and the
code pill appears only if the strategy doc puts an offer up top. The flow blueprint says
which flows this applies to.

## 2. Below the fold: the content

Everything after the hero is the content: education, story, reviews, product promotion,
objection handling. Each section has its own short heading. Close with the offer and a
button again so readers at the bottom don't have to scroll back up.

## 3. Dynamic content (Klaviyo)

Dynamic sections (cart items, recently viewed, recommendations) are built later in
Klaviyo. In the design, show a placeholder card: a gray rounded card with "KLAVIYO",
the block type (e.g. "DYNAMIC CART BLOCK") and one line saying what it pulls and its
fallback (e.g. "Recently viewed. Falls back to best sellers when empty.").

Placement depends on how central the dynamic content is to the email:

- **The email is about their items** (abandoned checkout, abandoned cart, browse): order
  is headline, subheadline, button, then the dynamic block right under the hero, so
  their items are visible the moment they open it.
- **The dynamic block supports the email** (welcome recommendations): place it in the
  content below the fold.

## 4. Never blocky

The main thing is the **graphics behind the content** and **how product photos sit in
the layout**. A Fluid email should never look like a stack of flat rectangles.

Techniques from Fluid's designs (use several per email, not all):

- **Products break out of their frames.** The product cutout overlaps the top edge of its
  card or panel (`.pcard`, `.pfeat`).
- **Type behind the product.** The product name repeated large and faded behind the
  bottle or bag (`.pfeat-type`).
- **An atmospheric background running behind the content**: smoke, splashes, a blurred
  stadium, fire, texture (`.section--image`, `.section--blur`, hero background).
- **Full-bleed hero photos with text on a scrim**, often with rounded bottom corners
  (`.hero--overlay`, `.hero--rounded`).
- **Decorative elements bleeding off the edges**: chiles, flames, splashes poking in
  from the side (`.deco`). Keep them small and at the edges, never over text.
- **Button color pulled from each email's hero image**, so each email feels designed as
  a piece, not recolored.

## 5. Transitions between sections

Sections never meet at a hard straight edge. Every change of background gets a
transition:

- **Gradient fade** from one section color into the next (`.tx--fade`).
- **Dripping border** where the upper color drips into the next section (`.tx--drip`).
- **Squiggly / wavy edge** (`.tx--wave`), or a squiggly line divider in the accent
  color between two sections on the same background (`.tx--squiggle`).
- Rounded hero bottoms and image fades also count.

This includes the move into the footer. Older Fluid examples still have hard edges;
don't copy them.

## 6. Product blocks: name and button only

A product block is the product image, the product name, and a button. **No product
descriptions and no labels** (no "BESTSELLER", no per-product discount badges), even
though older examples have them. Guidance cards ("Top break or underbarrel?") and
reviews are not product blocks and keep their text.

## 7. Fresh images across a flow

Don't reuse the product images from the previous email in the same flow. Fluid's designs
leave this note for designers; repeated shots make a follow-up feel like a resend.

## 8. Copy

Use the copy doc's text exactly. Don't add, cut or reword. If a block has no copy,
remove the block.

## 9. Format basics

- 600px wide, single column on mobile, centered layout.
- Buttons at least 48px tall, wide enough to tap easily. Body text 15px or larger.
- Headline case and weight follow the brand (many Fluid clients use all-caps condensed
  display type, but follow the brand kit).
- Footer: logo, optional trust-icon row and brand tagline, social icons, "Manage
  preferences | Unsubscribe" and the legal line.
- **Fonts in real inboxes**: Gmail ignores most custom web fonts, so the team may bake
  headlines into images when building in Klaviyo. Design in the brand font; note any
  font that is a stand-in.

## 10. CTA casing matches the brand's website

Buttons are written the way the brand writes its own website buttons. Check the site (button text and any
uppercase styling) and record it in the brand kit as "CTA casing". ALL CAPS on the site → ALL CAPS in the
emails; Title Case on the site → Title Case ("Shop The Sale"). If the site is mixed or unclear, use Title Case.
Never lowercase or sentence-case buttons ("Shop the sale") unless that's exactly how the site does it.
