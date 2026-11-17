# Handing copy to the designer

The designer fills a template from `brain/design/fluid-email-designer/templates/<flow>/<email>.html`. Each template marks its copy slots as `{{PLACEHOLDERS}}`, so the copywriter writes **to those slots**. That's what lets the designer use the copy exactly as written.

## Find the slots

List a template's placeholders:

```bash
grep -o '{{[A-Z0-9_]*}}' brain/design/fluid-email-designer/templates/abandoned-checkout/02-reviews.html | sort -u
```

Ignore the image slots (`*_IMAGE`, `*_CUTOUT`, `*_ICON`, `LOGO*`, `BADGE_*`): those are the designer's. Write every text slot, or say the block should be deleted.

## Output format

```
Template: abandoned-checkout/02-reviews
Client: Night Shift Athletics (demo) · Flow: Abandoned Checkout · Email 2

SUBJECT (pick 1): Can't decide? Let the reviews do the talking
SUBJECT (option): What players noticed after one practice
SUBJECT (option): The fit question, answered
PREVIEW (pick 1): Your cart's still here, and so are they
PREVIEW (option): Plus the returns policy, in plain words

HEADLINE: Get the right fit. Get locked in.
SUBHEADLINE: [from returns_policy, e.g. "Wrong size or color? Swap it inside 90 days."]
BUTTON: Return to checkout
CART_TITLE: In your cart
REVIEWS_TITLE: What players say
REVIEW_1_QUOTE / REVIEW_1_NAME: [from the client's review page; never invented]
REVIEW_2_QUOTE / REVIEW_2_NAME: [same]
POLICY_TITLE: The fine print, plainly
POLICY_1_TITLE / POLICY_1_TEXT: Returns / [from returns_policy]
POLICY_2_TITLE / POLICY_2_TEXT: Exchanges / [from returns_policy]
POLICY_3_TITLE / POLICY_3_TEXT: Guarantee / [from returns_policy]
HELP_TITLE: Still sizing it out?
HELP_TEXT: The fit guide gives you an exact size in about a minute.
HELP_BUTTON: Find my fit
RETURN_BUTTON: Return to checkout
LEGAL_LINE: [business_address from the profile, plus any required disclaimer]
DELETE: none

NOTES: Subject pick: their top-RPR sends used customer-quote subjects (3 of the top 5).
```

Slots that aren't copy: images (`*_IMAGE`, `*_CUTOUT`, `*_ICON`, `LOGO*`, `BADGE_*`) are the designer's, and `DYNAMIC_NOTE` describes the Klaviyo block, which the designer and builder fill.

Keep the template's slot names exactly. For lists (benefits, reviews, guides) number them as the template does.

## Plain-text emails

Templates ending in `-plain` (founder notes, post-purchase letters, win-back check-ins) take the letter as paragraphs: `OPENING`, `PARAGRAPH_1`… `SIGN_OFF`. Write it as a letter first, then split it into the slots.

## Campaigns without a Fluid template yet

Fluid's designer has templates for flows; campaign templates come next. Until then, write campaign copy in the same block order the design rules require (headline, subheadline, offer, button above the fold; sections with their own headings; closing offer and button) and label each block plainly.
