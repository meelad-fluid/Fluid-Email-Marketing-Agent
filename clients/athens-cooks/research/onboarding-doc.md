# Athens Cooks — Onboarding Doc
_Prepared 2026-11-26 · Sources: onboarding answers (brief), athenscooks.com, Klaviyo audit (last 60 days), Klaviyo order events (last 90 days / 365 days), public reviews_

**The short version:** a curated, family-owned kitchen store, café and cooking school in Athens, GA that ships nationwide. Email is barely being used for what it could do.
- Campaigns only started on Nov 17, and flows earned about $4.4k in 60 days on a store doing about $130k a quarter
- The abandoned cart flow is misfiring (14,595 recipients, $712)
- The welcome flows reached only 10 people in 60 days
- Classes, gift cards and knife sharpening quietly drive a big share of first orders

---

## 1. What has worked (Klaviyo)

**Basics** (Klaviyo, last 60 days)
- **List:** the full-list send reached 20,905 people
  - The engaged segment Fluid has been using reaches about 3,700
- **Pop-up:** "FC | Pop Up" is live
  - The welcome offer is TENOFF (10% off the first order, "some exclusions") (site)
  - Its submit rate isn't in the audit
- **Opens:** 49.5% average, against a 35% benchmark
  - Apple privacy inflates this number
- **Clicks:** 0.64% average, against a 0.5% benchmark
- **Sends:** 5 email campaigns in 60 days, all between Nov 17 and Nov 24
  - No SMS campaigns, though an SMS List exists
- **Unsubscribes:** 0.74%–1.16% per send, which is high (healthy is under 0.3%)
  - Expected for a list that hadn't been mailed in a while
  - Watch it through December
- **Lists:** Email List, SMS List, VIP 2025, GoTab, Preview List

**Flows** (last 60 days, 7 live)

| Flow | Recipients | Revenue | RPR | Note |
|---|---|---|---|---|
| FC \| Post Purchase | 1,821 | $3,654 | $2.01 | Best earner, 31 orders |
| FC \| Abandoned Cart | 14,595 | $712 | $0.05 | Volume is far above real checkouts. Trigger or filter is wrong |
| FC \| Welcome (Cookware) | 10 | $48 | $4.82 | Barely firing |
| FC \| Browse Abandonment | 97 | $0 | $0 | Low volume, no sales |
| FC \| Welcome (Baking) | — | — | — | No volume in the top 10 |
| FC \| Welcome (Table + Bar) | — | — | — | No volume in the top 10 |
| FC \| Winback 90d | — | — | — | No volume in the top 10 |

- **Missing core flow:** Site Abandonment
- **SMS in flows:** only on Cart and Browse

**Campaigns, last 60 days** (all five)
- **Best by RPR:**
  - "Pink House Alchemy for your Thanksgiving coffee" · small-maker syrups · no code · $0.41 RPR · $1,530
  - "A $275 Shun knife is $175 today" · MAP-approved sale price in the subject · $0.33 RPR · $1,236
  - "Get the roasting pan out before November 26" · Thanksgiving roasting · $0.20 RPR · $738
  - **What they share:** one specific product with a specific reason, and a real number or maker name in the subject
- **Worst by RPR:**
  - "Check your kitchen before Thanksgiving" · full list of 20,905 · $0.06 RPR, 20.6% open rate
  - "Thanksgiving is November 26. Check the kitchen first." · checklist topic · $0.06 RPR
  - **What they share:** generic "check your kitchen" checklists with no single product or price to want

**Takeaways**
1. Specific beats general: a named maker plus a price or story earns 3–6× the RPR of a checklist
2. Mail the engaged segment (about 3,700): the full-list send had a third of the open rate and the same RPR as the weakest engaged send
3. Fix the abandoned cart flow before Black Friday traffic. It is mailing roughly 14× the real checkout volume
4. The welcome flows aren't receiving pop-up sign-ups. That's the biggest leak, since TENOFF drove 80 orders and $10,380 in 90 days
5. Post-purchase works. Keep it and build on it

---

## 1b. What sells (Klaviyo Shopify order events, last 90 days)
_Shopify isn't connected. These numbers come from Klaviyo's Placed Order events, which appear to include in-store (POS) sales: "IN STORE" mixer listings, a Jura display unit and classes all show up. See question 1._

- **Volume:** 1,008 orders · $129,820 · AOV $128.79
- **Order values (p25 / median / p75 / p90):** $43 / $81 / $159 / $260
  - 24% of orders are over $160
  - Free shipping starts at $199, a natural "add one more" threshold
- **Top sellers by revenue:**
  - **Gift card** · $4,315 · 34 orders, 27 of them first orders
  - **Ankarsrum stand mixer (in store)** · $3,200 · 4 orders
  - **Cooking classes** · about $8,900 across 7 classes
    - Carbonara · $1,530
    - Nice Buns! · $1,530
    - Austrian Holiday Cookies · $1,350
    - Thai Cooking · $1,350
    - Cooking Class · $1,170
    - Ravioli Date Night · $1,080
    - Savory Galette · $900
  - **Knife sharpening** · $1,018 · 83 units, 34 orders
  - **Cookware:**
    - Le Creuset 8 qt Dutch oven · $950
    - Smithey skillets · $920
    - Simplex kettles · $960
    - Mauviel M'Heritage sauté · $850
- **Best first-order products:**
  1. Le Bon Garçon sea salt caramels · 35 first orders
  2. Athens Cooks gift card · 27
  3. Professional knife sharpening · 26
  4. Gift wrapping · 11
  5. Austrian Holiday Cookies class · 9
  6. Zwiesel Tritan outdoor wine glasses · 8
  7. Carbonara class · 7
  8. ThermoWorks Thermapen ONE · 5
- **Codes:**
  - TENOFF · 80 orders · $10,380
  - Class discount · 6 orders
- **Repeat:**
  - 15.6% of 1,770 first-time buyers came back
  - Median 18 days to the second order (p25 4 days, p75 64 days)
  - 13.8% reordered the same product, mostly knife sharpening and gift cards
- **Paths:**
  - Sharpening → sharpening
  - Wine class → the wine from the class
  - Charcuterie class → pizza class
  - Board conditioner → more home goods
  - Pan seasoning → wok seasoning
- **Cohorts to email:**
  - One-time buyers 30–60 days · 240
  - One-time buyers 60–120 days · 330
  - Due to reorder · 31
  - Lapsed repeat buyers · 597
  - Top-10% VIPs (spent $358+) · 379
  - B2B-sized buyers ($1,000+ orders) · 38

**What it means for email**
- Three products are the doorway: classes, gift cards and knife sharpening. They're local and service-led, and they bring people back
- The big cookware brands sell at high tickets but rarely as first orders. Email's job is the trust that gets someone from caramels to a Staub
- The 18-day median to a second order is fast. The post-purchase second-order nudge should land inside two weeks

---

## 2. The brand

**What they sell** (site, brief)
- **Kitchen:** cookware, cook's tools, cutlery, electrics
  - Hestan, Staub, Le Creuset, Mauviel, Smithey, Shun, Vitamix, Breville, Ankarsrum, Jura
- **Baking:** Emile Henry, Hestan OvenBond bakeware, Ankarsrum
- **Table + Bar:** Bergs Pottery, Zwiesel, Costa Nova, Ichendorf
- **Market:** Oliviers & Co, Le Bon Garçon, Pink House Alchemy, Regalis, local makers, wine
- **Local makers on the site:** 1000 Faces Coffee, Georgia Sourdough Co., Rock House Creamery, Lucky Bee Farms, Condor Chocolates
- **Services:**
  - Cooking classes ($35–$100)
  - Knife sharpening (from $12, 2–3 business days)
  - Gift registry
  - Gift wrapping
  - Catering
- **Café:** coffee and pastries in the morning, beer and wine in the afternoon, breakfast and lunch from the chef
- **Current offer:** Black Friday prices on selected items, "Prices as marked" (site, Nov 26)
  - Hestan Classic Roaster · $160, was $225
  - Staub 7 qt · $300, was $470
  - Shun Premier 8" · $175, was $275
  - Vitamix Ascent X4 · $650, was $700

**Mission and founders**
- Husband-and-wife owned (brief)
- **Courtney:** co-founder and CEO, with a background in kitchen retail, restaurants, teaching and interior design (site /pages/about)
- **Grady:** co-founder, Atlanta native with deep Athens roots. Did the build-out and operations, and now helps customers find the right class or product. He's also named in sharpening reviews (site)
- Established 2022 at 100 Prince Ave, Athens, GA
- **Mission:** "Bringing families and communities together through food," with ethical, sustainable kitchen goods (site /pages/about)

**Why it's different** (one sentence)
- Everything is chosen by a family who'd use it in their own kitchen, for quality, safety, sustainability and fair sourcing, and real people answer when you're stuck (brief)

**Proof bank**
- **Knife sharpening:** 9 reviews, all 5★ (site, product page)
- **Yelp:** about 4.1★ from 17 reviews (search listing, unverified)
- **Google reviews:** link given in the brief but not readable by us. Need an export or a screenshot
- **Press:** Red & Black sushi class review: "an elevated experience inside of a remodeled cooking store"
- **Service:** in stock when others aren't, at maker-controlled prices (brief)

**Offers and rules**
- Max discount is 10% (brief)
- Strict MAP on most brands. No price competing (brief)
- **Welcome:** TENOFF, 10%, "some exclusions." The exclusion list is needed
- **Free shipping:** standard shipping on US orders $199+
- Rewards program ("Earn Rewards") and gift registry are in the site nav. Details needed

**Visual identity**
- **Logo:** white wordmark ("Word Logo White letters" on the site)
- **Photography:** pale marble counters, real food in real pans
- **Fonts and hex colours:** not in the onboarding doc. Brand assets Drive folder is private. The brand book holds placeholders
- **Buttons:** site CTAs are Title Case ("Shop Black Friday Sale", "Explore Cooking Classes")

---

## 3. Avatars
Pop-up groups match the live welcome flows: **Cookware · Baking · Table + Bar**. The avatars below cut across those groups by *why* people buy.

### Avatar 1: The home cook upgrading for good
- **Who they are:** 45–65, about 65% women (brief)
  - Cooks as a hobby
  - Replacing worn or coated pans with pieces meant to last
  - Usually finds Athens Cooks when hunting a specific brand that's out of stock elsewhere (brief)
- **Problems they're facing:**
  - "It can all be so overwhelming" (brief)
  - Too many brands and too many claims
  - Coated pans that peel in a few years
  - Worry about chemicals and microplastics (brief)
- **Circumstances:**
  - Knowledgeable but short on time
  - Doesn't have a store like this in town, so finding one is "a time consuming process" (brief)
- **The desire:**
  - A kitchen of things that work, look beautiful and last
  - Bought once, from people they trust
- **What keeps them lying awake at night:**
  - Are the pans I cook my family's food in safe?
  - Am I living my values or just buying more stuff? (brief: "reject consumerism in theory, but justify… because they are buying quality")
- **What they think of themselves:** a thoughtful, informed cook who doesn't buy junk
- **Objections:**
  - Price ("very expensive")
  - Learning curve with stainless and cast iron
  - "Why not just buy from the maker or Amazon?"
- **Current situation → desire:** "My kitchen is full of stuff that doesn't last" → "Everything I reach for is something I'd hand down"
- **Entry products:**
  - Thermapen ONE
  - Smithey skillet
  - Shun chef's knife
  - Hestan roaster
  - Staub or Le Creuset Dutch oven

### Avatar 2: The giver and host
- **Who they are:**
  - Buying for someone who cooks: a spouse, adult kids, a host, a newlywed (gift registry)
  - Or setting a table for guests
  - Gift cards, caramels, gift wrap and wine glasses lead first orders (orders data)
- **Problems they're facing:**
  - "What do you get someone who already has a nice kitchen?"
  - Doesn't want a gift that ends up in a drawer
- **Circumstances:**
  - Holidays, birthdays, weddings, hosting
  - Short on time, wants it wrapped
- **The desire:**
  - Give something beautiful, useful and a little special
  - Look like they know the person
- **What keeps them lying awake at night:** not applicable for this brand. What drives them is wanting the gift to land, and to arrive on time
- **Objections:**
  - Will it arrive in time?
  - Will they like it?
  - Can they exchange it?
- **Current situation → desire:** "I never know what to get them" → "They'll use it every day and think of me"
- **Entry products:**
  - Gift card
  - Class gift
  - Le Bon Garçon caramels
  - Oliviers & Co oils
  - Zwiesel glasses
  - Bergs Pottery
  - Thermapen

### Avatar 3: The Athens local who comes for the experience
- **Who they are:**
  - Lives near Athens
  - Takes classes, drops off knives, grabs coffee and lunch
  - Buys a class for a date night or a friend (orders data)
- **Problems they're facing:**
  - Wants to cook better, and wants something fun to do in town that isn't another dinner out
- **Circumstances:**
  - Weekends, date nights, college parents' weekends, holidays
  - Classes sell in small seats
- **The desire:**
  - "I did more than just watch" (Red & Black)
  - Learn a technique, meet people, eat well
- **What keeps them lying awake at night:** not applicable. What drives them is fun, connection and learning a skill
- **Objections:**
  - Is it hands-on or a demo?
  - Will I be sharing a station?
  - What if I can't make the date?
- **Current situation → desire:** "Same restaurants every weekend" → "We made ravioli from scratch and I can do it at home"
- **Entry products:**
  - Classes
  - Knife sharpening
  - Gift card
  - Café

---

## 3b. Their world (the bank every email draws from)
_Key: lines in quotes are verbatim, with their source. ≈ marks a close paraphrase from a review summary. Confirm the wording before quoting it in an email._

_This bank is thin (about 45 lines). We need the Google reviews export and permission to quote them to reach 40+ per avatar._

### Avatar 1: The home cook upgrading for good
- **What they do:**
  - Cooks most nights
  - Bakes on weekends
  - Researches before buying anything over $100
- **Moments:**
  1. Scraping a flaking nonstick pan over the sink: "That's going in my eggs?"
  2. Reading three reviews of the same Dutch oven at 10pm, still unsure
  3. Finding the Staub colour sold out everywhere, then in stock in Athens
  4. Preheating a new stainless pan wrong the first time and the egg sticks
  5. Sunday bread dough that the old mixer can't knead
  6. Pulling the roaster out the week before Thanksgiving to check it fits the bird
  7. A dull knife squashing a tomato
  8. Unboxing an heirloom-weight pot and deciding where it lives on the stove
  9. Cooking for grown kids home for the holidays
  10. Choosing between two chef's knives in the store with someone who's used both
- **Calendar and rituals:**
  - Thanksgiving roast
  - Holiday baking (Dec)
  - New Year "kitchen reset" (Jan)
  - Soup and braise season (Jan–Feb)
  - Spring grilling
  - Tomato season (Jul–Aug)
  - Sunday bread
- **Their words:**
  - "worth the investment if you're willing to learn how to use and care for stainless steel" (Homes & Gardens, Hestan review)
  - "actually has held up really well the past few years" (blogger, $280 Hestan skillet)
  - "very expensive, but worth it if you are considering a premium, heirloom upgrade" (Homes & Gardens)
  - "you'll want to figure out how to preheat the pan" (Hestan review)
  - "much more durable than nonstick" (science writer, switching from nonstick)
  - ≈ "nonstick-coated pans only last two to three years" (blogger)
  - "The Staub will last a lifetime." (deal-forum commenter)
  - "a cheap stainless steel pot will last you a lifetime" (forum doubt)
  - "not cut out for kneading batches of bread" (Tom's Guide, on their old mixer)
  - ≈ switched from KitchenAid to Ankarsrum and "were in heaven" (The Fresh Loaf)
  - "We make a lot of strong whole-wheat bread and are very happy with it" ≈ (MetaFilter, Ankarsrum owner)
  - ≈ "don't expect this mixer to work like a KitchenAid" (MetaFilter)
  - ≈ "too heavy and bulky to store and clean" (The Fresh Loaf)
  - ≈ "not designed to handle low hydration bread dough" (The Fresh Loaf)
  - "easily handle much larger amounts of bread dough without so much as a shiver" (King Arthur Baking)
  - "despite 14 years of baking, broiling, freezing, and washing, this Emile Henry plate looks just as good as when a friend gave it to me" (Reviewed)
  - "have been using Emile Henry products for years now" (Emile Henry customer)
  - ≈ "got fake ones back in May… Amazon still had the confirmed fake sellers" (r/LeCreuset)
  - "They were even able to get a small notch out of my Shun Chef's knife which I was very worried about." (Lev P., site)
  - "Recently had a set of 5 Wustof knives sharpened. Athens Cooks did a great job!" (Lee L., site)
  - "It can all be so overwhelming" (brief, owner on customers)
  - "They actively look for alternatives to Amazon, hate Walmart and like to support small business" (brief)
  - "reject the disposability of society" (brief)
  - "They want to live their morals, but it is hard to do so because few businesses make it easy for them" (brief)
- **Trade language:**
  - Tri-ply
  - Clad
  - Fond
  - Preheat
  - Seasoning
  - Enameled cast iron
  - Cocotte
  - Burgundy clay
  - Hydration
  - Knead
  - Edge
  - Hone vs sharpen
  - MAP ("price as marked")
- **How they use it:**
  - Roaster for the turkey, then all winter for chicken and veg
  - Dutch oven for sourdough and braises
  - Thermapen for everything from steak to caramel
  - Seasoning service for woks and pans (orders data)
- **Doubts:**
  - "Too expensive" → buy once, in stock, prices set by the maker so you're not overpaying
  - "Learning curve" → classes, plus reply to ask
  - "Why not Amazon?" → genuine stock from a store that answers. Never name Amazon in copy
- **Who they buy for:**
  - Themselves
  - A spouse who cooks
  - Grown kids setting up a first kitchen

### Avatar 2: The giver and host
- **What they do:**
  - Hosts holidays
  - Buys for a cook in the family
  - Brings a host gift
- **Moments:**
  1. Dec 18, nothing bought yet for the person "who has everything"
  2. Standing in the shop choosing between caramels and olive oil for a host
  3. Asking for it wrapped
  4. Setting the table the night before guests arrive
  5. Buying a class for parents' anniversary
  6. Grabbing a gift card on the way to a birthday
  7. Picking glasses that won't shatter on the patio
  8. Checking the shipping cut-off on the 15th
- **Calendar:**
  - Thanksgiving hosting
  - Small Business Saturday
  - December gifting and shipping cut-offs
  - Valentine's date night
  - Mother's/Father's Day
  - Graduation (UGA)
  - Wedding season (registry)
- **Their words:**
  - "Give the gift of good taste" (site, gift card)
  - ≈ "Best gift I've given" (cooking class gift review, category)
  - "This was a great gift/night." (Uncommon Goods class review)
  - ≈ "the hit of the season" (class gift box review, category)
  - ≈ bought a Thermapen "to finally produce a moist Christmas turkey" after a reputation for dry birds (Thermapen reviewer)
  - ≈ "a good Christmas or birthday present for family and friends" (Thermapen reviewer)
  - ≈ ordered "one for themselves and one as a present" (ThermoWorks reviewer)
  - "since we started shopping there, we have bought a ton!!" (Heather F., site)
- **Trade language:**
  - Host gift
  - Stocking stuffer
  - Registry
  - Wrapped
  - "Something they wouldn't buy themselves"
- **How they use it:**
  - Gift card plus a class
  - Caramels as an add-on
  - Gift wrap on almost every December order (orders data: gift wrap is a top-5 first-order item)
- **Doubts:**
  - "Will it arrive by Christmas?" → exact cut-off dates (needed from client)
  - "What if they have one?" → exchange policy (needed)
- **Who they buy for:**
  - Spouse
  - Parents
  - Hosts
  - Newlyweds
  - Teachers
  - Grown kids

### Avatar 3: The Athens local
- **What they do:**
  - Takes classes
  - Drops off knives
  - Meets friends for coffee or lunch
- **Moments:**
  1. Friday night, rolling ravioli at a shared counter
  2. Dropping five knives in a towel on the counter
  3. Picking them back up "done exactly when they said"
  4. Booking the holiday cookie class with a friend
  5. Coffee on Prince Ave before work
  6. Parents' weekend: "What do we do with them?"
  7. Buying the wine from the wine class
  8. Kids' summer camp sign-up
- **Calendar:**
  - Class calendar drops
  - Holiday cookie classes (Dec)
  - Date night (Feb)
  - Summer camps
  - UGA football weekends and graduation
- **Their words:**
  - "I did more than just watch. Rather, I actively participated" (Red & Black)
  - "I looked at their menu of the other things they're doing, I'm ready to sign up for every one." (Bill Yates, Red & Black)
  - "Hey, you're learning a technique. You're not learning a recipe tonight." (Chef Hunter White, Red & Black)
  - "I had fun, I met friends, I learned new skills and I enjoyed a delicacy, made with time and care." (Red & Black)
  - "My knives are perfect again!" (Juanita B., site)
  - "The price was very reasonable and they were done exactly when they said they would be." (Rick R., site)
  - "They are quick and efficient, and they return the blades razor sharp." (J.R., site)
  - "They are very sharp and smooth on the edges." (Andrea W., site)
  - "Grady does a wonderful job preserving the utility of our knives." (Mike M., site)
  - ≈ disappointed to "share the tasks of cooking with two other people" (category doubt, couples classes)
- **Trade language:**
  - Hands-on
  - Station
  - Seat
  - Date night
  - From scratch
  - Edge guard
- **How they use it:**
  - Class → buy the ingredients or tools used in class
  - Sharpening every few months (repeat path)
- **Doubts:**
  - Demo or hands-on?
  - Shared station?
  - Cancellation policy (needed)
- **Who they buy for:**
  - Partner
  - Friends
  - Parents visiting
  - Kids (camps)

---

## 4. Voice

**Sender persona:** *Lucy from Athens Cooks* (proposed, needs approval)
- Warm and easy to say
- Sounds like someone behind the counter
- Founder notes stay from Courtney and Grady
- If Courtney is happy to sign the campaigns herself, "Courtney from Athens Cooks" beats any persona for a family-owned shop

**How the brand talks**
- **Friendly and knowledgeable, not stuffy** (brief)
  - "Get the kitchen ready before the guests arrive." (site)
- **Practical and long-term**
  - "The things you will use, year after year." (site)
- **A little playful**
  - "sharper than a witty dinner guest" (site, sharpening)
- **Local and personal**
  - "Athens Cooks is at 100 Prince Avenue in Athens." (site)

**Words they use**
- Curated
- Ethically sourced
- Sustainable
- Quality
- Locally sourced
- "Made with love"

**Words to avoid**
- Cheap, cheapest, deal-hunting language
- Competitor names
- "Non-toxic" or "chemical-free" unless the maker states it for that exact product
- Stuffy luxury words ("exquisite", "indulge")

**Disclaimers**
- "Selected items only. Prices as marked." on sale sends
- "Some exclusions" on TENOFF (full list needed)

---

## 5. Website interrogation: conflicts and open questions

| Brief says | Site / data says | Question |
|---|---|---|
| Best sellers online: Hestan, Emile Henry, Bergs, Ankarsrum, GIR | Order data top: classes, gift cards, sharpening, caramels | Does Klaviyo's order data include in-store (POS) sales? Which is online-only? |
| Don't compete on price | Homepage is a Black Friday sale | Which items and dates are vendor-approved promos? When do BF prices end? |
| Max 10% | TENOFF "some exclusions" | Which brands are excluded? |
| — | "Host & Roast pricing ends November 23" still on the homepage | Remove the stale note? |
| — | Product cards show "Save 0% Save %" | Theme bug, worth fixing |
| — | "Chef's latests creations" | Typo |
| — | "Earn Rewards" and "Join" in the nav | What's the rewards program, and can email mention points? |
| Reviews link (Google) | Not readable by us | Can you send an export, and can we quote reviews by first name? |
| Brand assets folder | Private Google Drive | Can you share access (fonts, colours, logos, photos)? |

---

## 6. Competitors
- **Williams Sonoma:** huge range, own-label, constant sales
  - We're smaller and chosen by a family, with real advice
- **Food52:** editorial plus curated shop and own brand
  - Closest on taste; we add a real store, classes and service
- **Sur La Table:** national chain with classes
  - We're independent, local and answer personally
- **The Cook's Warehouse (Atlanta):** store plus cooking school, decades old
  - Closest model; Athens Cooks owns Athens and ships nationally
- **Vendors' own sites:** same MAP price
  - We offer curation across brands, stock when they're out, and gift wrap and a real person

Sources: athenscooks.com (home, /pages/about, /pages/learn, knife sharpening page) · Klaviyo audit and order events 2026-11-26 · Red & Black sushi class review · category reviews (Homes & Gardens, Reviewed, King Arthur Baking, The Fresh Loaf, MetaFilter, Tom's Guide, Thermapen and class-gift reviews)
