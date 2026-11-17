# Building from the onboarding form (client not in Hiro)

New clients usually aren't in Hiro yet. Their onboarding form, brand guidelines and website still answer most of what the strategy needs; this file says where each answer goes and how to fill the data slots without data. When the client later shows up in Hiro, rerun the skill and replace the estimates with numbers (Step 7 in SKILL.md).

## Contents

- [Where the evidence comes from](#where-the-evidence-comes-from)
- [Onboarding form → strategy](#onboarding-form--strategy)
- [Filling the data slots without data](#filling-the-data-slots-without-data)
- [Offers when only a cap is given](#offers-when-only-a-cap-is-given)
- [Labeling](#labeling)

## Where the evidence comes from

Read all of it before planning, in this order:

1. **The onboarding form or brand guidelines** the person shared (often a .docx of Fluid's standard questionnaire).
2. **Docs the form links to** — product docs, FAQs, ingredient sheets, review folders. Google Docs and Drive links open with the Drive connector (`read_file_content`, or `search_files` for a folder's contents). Product facts like serving size, servings per container, flavors, how to take it, and certifications usually live here.
3. **The website** — product pages, the home page, the FAQ. Fetch the URLs the form gives; for other pages, search for them rather than guessing paths. Collections sorted by "best selling" are a useful stand-in for sales data.

If none of these exist (just a brand name), ask for the onboarding form or the website before going further. Without them, the strategy would be Fluid's template with a name on it.

## Onboarding form → strategy

Fluid's onboarding questionnaire asks the same questions every time. Each answer has a home:

| Question | Where it goes |
|---|---|
| Brand URL | Website facts; product pages to fetch |
| Email sending software / eCommerce platform | Trigger and dynamic-block wording in the flow notes (Klaviyo vs Omnisend; Shopify events) |
| Describe your brand in 2 sentences | Brand mission (Welcome #1), founder story and "why we exist" (Welcome #2, Post-Purchase #1) |
| What's unique | The reason to believe: Welcome #1 benefit paragraph, Site Abandonment #1 hook, Browse #1 "why this beats the alternatives", Best Seller Showcase |
| Top competitors | What Browse and Checkout position against. Name the difference, never the competitor, in the emails |
| Best performing products | The hero product and the best-seller slots (see below) |
| Highest % we can give away | The ceiling for every offer (see below) |
| Ideal customer | Who Welcome speaks to; the audience line under Built From Your Brand |
| Pain points (often split into top-of-funnel problems and mid-funnel questions and objections) | Top-of-funnel problems → pop-up options and Welcome #1's benefit paragraphs. Mid-funnel objections → Welcome #3 and #4, Browse #2, Checkout #2, Post-Purchase #2. Use their wording; it's the customer's language |
| Tone of voice | A voice note in Built From Your Brand, and copy-direction lines where tone matters most (Welcome #2, Post-Purchase #3) |
| Sticking points | The strategy's emphasis. "Need to increase LTV" puts the weight on Post-Purchase, the optional Replenishment flow and Winback |
| Reviews link | Social proof source for Welcome #3, Browse #2, Checkout #2. If you can't open it, it's an Open Item |
| Brand assets folder / design inspiration | Not for the strategy. Mention in Open Items for the designers |
| Comments about flows | Hard constraints. Follow them exactly ("mainly promote the gummies; other products as a free gift or upsell") |
| Anything else (linked docs) | Read them: product facts, usage, claims the brand already makes |

## Filling the data slots without data

Each **DATA** slot in the system files has an onboarding-mode answer. Use these, and label every one (see Labeling).

| Slot | Without Hiro |
|---|---|
| Pop-up options | The 3 strongest top-of-funnel goals or problems from the form, each mapped to a product. For a one-hero-product brand, the three options change the *benefit*, not the product (as Beyond Slim, ANF Care and Xtressé did): pick goals the hero product genuinely serves, across the main customer segments |
| Welcome #1 products per option | The product that serves that goal; for a hero-product brand, the hero product in each version (variant or flavor if relevant) plus the secondary product that best fits the goal |
| Best sellers (Welcome #4, Site #2) | The client's stated best performers, then the site's best-selling sort. Respect the client's focus requests |
| Attach item (Checkout #2) | What the client names as an upsell or free gift, or the catalog's natural add-on |
| Pairing map (Post-Purchase #4) | The routine logic: the other format, the complementary product, the bundle or subscription, within the client's stated upsell rules |
| Replenishment windows (optional flow) | **Supply length**: servings per container ÷ daily servings = days of supply. Email #1 goes about 5 days before the supply runs out, so the reorder arrives in time. Do the arithmetic in the plan |
| Winback day | The reference docs' rule of thumb: roughly 1.5× the supply length for replenishable (a 30-day supply → 45 days), 90 days for one-off |
| Existing flows audit, pop-up submit rate | Not available. Ask whether any flows or a pop-up are live; skip the audit if not |

## Offers when only a cap is given

The onboarding form asks for the *highest* discount, not the welcome offer. When only the cap (C) is given, propose the whole ladder inside it rather than stopping to ask, and confirm it at the plan gate:

- Welcome: about half the cap, rounded to a common number (C = 20% → 10%)
- Welcome #5 upgrade: W + 5 points, never above C
- Browse incentive: W
- Mystery discount: the teaser ("up to …") **never above C**, and the real value below it (C = 20%: "up to 20%", real 15%). The "up to 30%" teaser in most reference docs is off-limits when the client has said 20% is the most they'll give
- Second-purchase: W to W + 5
- Winback: C, the ceiling offer
- Free gifts the client allows (Arq8: other products as a free gift) can replace a discount step, which protects the cap

If neither a welcome offer nor a cap is given, ask; don't guess both.

## Labeling

- In the **plan**, open with "What we're building on" instead of "What the data says": 5 to 7 points from the brand inputs, each naming its source ("from the onboarding form", "from the gummies product doc"). End with a short **"To confirm once Hiro is connected"** list: every slot you filled with an estimate.
- In the **doc**, the opening section is **Built From Your Brand** (customer, problems, product, focus, voice), and every estimated choice carries a short note in its Goals bullet ("estimated from a 30-day supply; adjust to actual reorder timing"). List them again under Open Items.
- Never present a client-stated best seller or a supply-based window as measured data.
