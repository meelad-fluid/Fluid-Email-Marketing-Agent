// Writes Fluid's flow system to brain/flows/: the 4-step pop-up, the six core flows (Welcome, Site
// Abandonment, Browse Abandonment, Abandoned Cart, Post-Purchase, Winback), the optional Replenishment
// and Sunset flows, and system.json (offer ladder + flow rules).
//
// Source: the flow-strategy skill's system files (brain/skills/fluid-flow-strategist/references/
// {replenishable,one-off}-system.md), distilled from Fluid's 31 client strategies. Structure, email
// counts and timings are Fluid's and identical across both versions; only the goals differ.
// Usage: npm run brain:flows
import { mkdir, writeFile } from "node:fs/promises";
import { FlowFrameworkSchema, validateFramework, type FlowAction, type FlowFramework } from "../lib/flows/framework";
import { PopupSchema, type Popup } from "../lib/flows/popup";

const SRC = { kind: "fluid-written" as const, note: "Fluid flow system v2, distilled from 31 client strategies (fluid-flow-strategist skill)" };
type Unit = "minutes" | "hours" | "days" | "weeks";
type Goals = { all?: string[]; replenishable?: string[]; one_off?: string[] };
type EmailIn = {
  id: string;
  name: string;
  job: string;
  template: string;
  topic: string;
  format?: "designed" | "plain_text";
  sendingTo: string;
  offer?: string;
  structure?: string;
  goals: Goals;
  dynamicBlock?: "cart-items" | "checkout-items" | "viewed-product";
  sameAs?: string;
};
type Step = { delay: [number, Unit, string?] } | { email: EmailIn } | { sms: { id: string; job: string; body: string; sameAs?: string } };

// Turns a linear list of steps into linked Klaviyo-style actions.
function chain(steps: Step[], prefix = ""): FlowAction[] {
  const out: FlowAction[] = [];
  let d = 0;
  const ids = steps.map((s) => ("delay" in s ? `${prefix}delay-${++d}` : "email" in s ? prefix + s.email.id : prefix + s.sms.id));
  steps.forEach((s, i) => {
    const next = ids[i + 1] ?? null;
    if ("delay" in s) {
      const [value, unit, variable] = s.delay;
      out.push({ id: ids[i], type: "time-delay", delay: { value, unit, ...(variable ? { variable } : {}) }, next });
    } else if ("email" in s) {
      const e = s.email;
      out.push({
        id: ids[i],
        type: "send-email",
        name: e.name,
        job: e.job,
        template: e.template,
        subject: [e.topic],
        topic: e.topic,
        format: e.format ?? "designed",
        sendingTo: e.sendingTo,
        smartSending: false,
        ...(e.offer ? { offer: e.offer } : {}),
        ...(e.structure ? { structure: e.structure } : {}),
        ...(e.dynamicBlock ? { dynamicBlock: e.dynamicBlock } : {}),
        ...(e.sameAs ? { sameAs: e.sameAs } : {}),
        goals: { all: e.goals.all ?? [], replenishable: e.goals.replenishable ?? [], one_off: e.goals.one_off ?? [] },
        next,
      });
    } else out.push({ id: ids[i], type: "send-sms", job: s.sms.job, body: s.sms.body, ...(s.sms.sameAs ? { sameAs: s.sms.sameAs } : {}), next });
  });
  return out;
}

const NO_ORDER = { description: "Placed Order zero times since starting this flow" };
const W = "{{offers.welcome}}";

// ─── Pop-up ──────────────────────────────────────────────────────────────────────────────
const popup: Popup = {
  key: "popup",
  name: "Opt-in Pop-up (4 steps)",
  version: 2,
  purpose:
    "Turn site traffic into owned subscribers at the highest submit rate possible, and learn which of three product groups / goals each subscriber came for so Welcome Email #1 opens on their problem, not ours.",
  target: "10%+ submit rate",
  profileProperty: "{{popup.property}}",
  routesTo: "welcome: conditional split on the answer → Email #1 (Option #1) / #1 v2 (Option #2) / #1 v3 (Option #3)",
  steps: [
    {
      step: 1,
      name: "Teaser + Collect Zero Party Data",
      headline: `Want ${W}?`,
      fields: ["{{popup.option_1}}", "{{popup.option_2}}", "{{popup.option_3}}"],
      goals: [
        "Headline states exactly the welcome offer the subscriber gets (the Email #5 upgrade is never promised up front)",
        "One question with three answers; each answer must map to real products (the three groups new customers actually start with: DATA)",
        "Answers are worded the way a shopper would say them",
        "Gets a micro-commitment before asking for the email, which lifts opt-in rate",
        "Creative: the hero product for the brand, nothing else competing",
      ],
    },
    {
      step: 2,
      name: "Collect Email",
      headline: "Where should we send it?",
      subheadline: `${W} off your first order, plus [what else they get: guide, early access, the breakdown people ask for]`,
      fields: ["Email"],
      button: "Continue",
      goals: ["Sub-headline says what they get", "Optional trust line under the button"],
    },
    {
      step: 3,
      name: "Collect SMS (optional for the subscriber)",
      headline: "Want it texted to you too?",
      subheadline: "Angle on what SMS gets them: restock alerts, new flavours/drops, early access. A few texts a month.",
      fields: ["Phone number"],
      button: "Yes, text me",
      secondary: "No thanks, email is fine",
      consent: "By submitting you agree to receive recurring automated marketing texts. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to cancel.",
      goals: ["Its own step, always skippable", "Consent line present"],
    },
    {
      step: 4,
      name: "Confirmation",
      headline: "You're in.",
      subheadline: `Your code is {{offers.welcome_code}} for ${W} off [where it works]. It's in your inbox now.`,
      button: "Shop {{popup.hero_product}}",
      goals: ["The code, where it works (exclusions), one button to shop"],
    },
  ],
  questionStyles: {
    replenishable: [
      { style: "Goal", example: "What is your primary wellness goal right now? (supplements)" },
      { style: "Product type", example: "What are you shopping for today? Salts / Seasoning Blends / ... (SPQR)" },
      { style: "Preference", example: "How do you like your jerky? (El Viejon)" },
      { style: "Pain point", example: "What's the hardest part of staying consistent? (Moneta) / What are you hoping LEVL helps with? Afternoon slump / Stress + recovery / Everyday hydration" },
      { style: "Research category", example: "What are you researching right now? (peptides)" },
    ],
    one_off: [
      { style: "Category", example: "What are you shopping for? Classic Gold Chains / Gold Rings / Everyday Bracelets (Gold Urban)" },
      { style: "Who it's for", example: "Who are you shopping for? (LGNDRY Fit)" },
      { style: "Style", example: "What's your style preference? Classic & Timeless / Warm & Versatile / Modern & Bold (Daily Belts)" },
      { style: "Occasion", example: "What occasion are you shopping for? Birthday / Wedding or formal / Vacation (Ellaé Lisqué)" },
      { style: "Fit or compatibility", example: "What type of fence do you have? (FencePot)" },
      { style: "Customer type", example: "Individual / Business Owner / Event Planner (Decals.com)" },
      { style: "Intent", example: "Buy A Drone / Repair My Drone / Upgrade My Fleet (Drone Doctor)" },
    ],
  },
  offerOptions: [
    "Percent off: 5%–20%, 10% most common",
    "Dollar off for high-ticket, framed as a welcome gift (Orion Moto: $25 off)",
    "Tiered/bundle savings (Daily Belts: unlock up to 30% off)",
    "No discount for expert-led or service brands (Drone Doctor: a free expert recommendation)",
  ],
  strategyNote: [
    "Why this question: it gets a micro-commitment and tells us which pain point / product group the subscriber walked in with",
    "Where the answer is stored ({{popup.property}}) and that it's reused in campaigns and launches",
    "That the headline offer is exactly what they get; the Email #5 upgrade lands as a genuine upgrade",
    "The creative direction for step 1",
  ],
  variables: [
    { key: "offers.welcome", description: "The welcome offer (W)", example: "10%" },
    { key: "offers.welcome_code", description: "Welcome code", example: "LEVL10" },
    { key: "popup.property", description: "Profile property that stores the step-1 answer", example: "levl_reason" },
    { key: "popup.option_1", description: "Answer #1 (a product group / goal new customers start with)", example: "Afternoon slump" },
    { key: "popup.option_2", description: "Answer #2", example: "Stress + recovery" },
    { key: "popup.option_3", description: "Answer #3", example: "Everyday hydration" },
    { key: "popup.hero_product", description: "The one product step 1 and 4 feature", example: "Açaí + Berry" },
  ],
};

// ─── Welcome ─────────────────────────────────────────────────────────────────────────────
const welcome1 = (v: 1 | 2 | 3): EmailIn => ({
  id: v === 1 ? "email-1" : `email-1-v${v}`,
  name: `Email #1${v === 1 ? "" : ` v${v}`}: Welcome Offer (Option #${v})`,
  job: `Welcome + deliver the offer to subscribers who answered Option #${v}`,
  template: "welcome/01-welcome-offer",
  topic: "Welcome to {{brand.name}}! Here's your {{offers.welcome}}, or a topic built on their answer (\"Something to reach for at 3pm that isn't coffee\")",
  sendingTo: `New subscribers who selected "{{popup.option_${v}}}"`,
  offer: "W (welcome offer) with Code and Value",
  goals: {
    all: [
      "Welcome to the brand",
      "Give them their offer: Code {{offers.welcome_code}}, Value {{offers.welcome}}",
      "Go over the brand mission (BRAND)",
      `Highlight the benefit / category they chose ("{{popup.option_${v}}}"), in their words, and how the brand delivers it`,
      `Highlight 3 best-selling products for this option (DATA: top first-order products in option ${v}), one line each`,
      "Same messaging and offer in all three versions; only the products and the benefit/category paragraph change",
    ],
    replenishable: ["Optional: trust signals (testing, certifications, review count), subscription or bundle options, a secondary CTA"],
    one_off: [
      "Add any ongoing offer and the \"codes can't be combined\" line (e.g. Buy Any 2, Get the 3rd Free)",
      "Trust basics for the category: fit and sizing (apparel), materials/warranty/care (jewelry), dimensions/delivery (home), compatibility/expert help (gear)",
      "Optional: the AOV angle (build a rotation, layer pieces, complete the set); expert-help CTA for high-ticket",
    ],
  },
});

const welcomeRest = (track: string): Step[] => {
  const same = (id: string) => (track === "a-" ? undefined : `a-${id}`);
  return [
    { sms: { id: "sms-1", job: "Welcome + the code (Klaviyo skips profiles without SMS consent)", body: "Welcome to {{brand.name}}! Here's {{offers.welcome}} off your first order: {{offers.welcome_code}}. {{links.shop}}", sameAs: same("sms-1") } },
    { delay: [4, "hours"] },
    {
      email: {
        id: "email-2",
        name: "Email #2: Personal Note from the Founder",
        job: "Highest-trust email in the flow: the founder in their own words",
        template: "welcome/02a-founder-note-plain",
        topic: "A note from {{brand.founder_first_name}}",
        format: "plain_text",
        sendingTo: "New subscribers",
        offer: "Soft reminder of W",
        sameAs: same("email-2"),
        goals: {
          all: ["Plain text. Never designed: it reads as personal", "The founder's story by name (BRAND)", "Why the brand exists", "Invite a reply", "Soft reminder of the code"],
          replenishable: ["The decision it made on purpose (quality over margin, taking ingredients out)"],
          one_off: ["Why they do things differently; what they won't compromise on (quality, honest advice, never a sale ahead of the right fit)"],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-3",
        name: "Email #3: Customer Reviews",
        job: "Social proof that answers the category's main objection",
        template: "welcome/03-reviews",
        topic: "Here's what people are saying about {{brand.name}}",
        sendingTo: "New subscribers",
        offer: "Reminder of W",
        sameAs: same("email-3"),
        goals: {
          all: ["Authentic reviews in the preferred structure: situation → problem → experience → outcome they reported (never fabricated)", "Review count and where it lives (BRAND)", "Remind them of the code without making it the reason to buy"],
          replenishable: ["Before/after stories, customer photos", "Reassure the category's main objection (taste, does it work, will it match my skin)"],
          one_off: ["Reviews and customer photos that answer this category's trust doubts (\"looks better than the photos\", \"fit true to size\", \"they helped me pick the right board\")"],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-4",
        name: "Email #4: Best Seller Showcase",
        job: "Show the easiest place to start",
        template: "welcome/04-best-sellers",
        topic: "Our best sellers",
        sendingTo: "New subscribers",
        offer: "Reminder of W",
        sameAs: same("email-4"),
        goals: {
          all: ["The core products / best sellers (DATA: what NEW customers buy first, ties broken by repeat rate)"],
          replenishable: ["How each one fits a need", "The easiest place to start"],
          one_off: ["A guided tour of the shop, not a product dump; each with who it's for", "High-ticket catalogs: include an entry-price product"],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-5",
        name: "Email #5: Upgrade offer for only 24 hours",
        job: "First direct ask: the upgraded offer, 24 hours only",
        template: "welcome/05-upgrade-offer",
        topic: "Your offer just went up, for 24 hours",
        sendingTo: "New subscribers who have not purchased",
        offer: "W + 5 points for 24 hours (dollar offers double); new code {{offers.welcome_upgrade_code}}",
        sameAs: same("email-5"),
        goals: {
          all: ["Upgrade the offer for 24 hours (offer ladder)", "The first direct ask to shop"],
          replenishable: ["Subscription or rewards if the client has them"],
          one_off: ["State exclusions (high-ticket, MAP-restricted, custom quotes) where they apply", "Expert help before ordering for considered purchases"],
        },
      },
    },
    { sms: { id: "sms-2", job: "The upgraded code and the 24-hour deadline", body: "24 hours only: your {{brand.name}} offer is now {{offers.welcome_upgrade}} off with {{offers.welcome_upgrade_code}}. {{links.shop}}", sameAs: same("sms-2") } },
  ];
};

const welcomeActions: FlowAction[] = [
  { id: "split-option-1", type: "conditional-split", label: "Answered Option #1?", condition: { description: "{{popup.property}} equals {{popup.option_1}}" }, next_if_true: "a-email-1", next_if_false: "split-option-2" },
  { id: "split-option-2", type: "conditional-split", label: "Answered Option #2?", condition: { description: "{{popup.property}} equals {{popup.option_2}}" }, next_if_true: "b-email-1-v2", next_if_false: "c-email-1-v3" },
];
for (const [t, v] of [["a-", 1], ["b-", 2], ["c-", 3]] as const) {
  const steps: Step[] = [{ email: welcome1(v) }, ...welcomeRest(t)];
  welcomeActions.push(...chain(steps, t));
}

const welcome: FlowFramework = {
  key: "welcome",
  name: "Welcome Flow (7 Emails + 2 SMS)",
  version: 2,
  status: "active",
  tier: "core",
  appliesTo: ["replenishable", "one_off"],
  purpose:
    "Engage new subscribers, educate them on the brand, position it as the leader in its space, get past trust doubts, get the first purchase, and keep reminding them of the welcome offer. 7 emails = Email #1's three versions + #2–#5; each subscriber receives 5.",
  source: SRC,
  trigger: { type: "list", source: "{{lists.popup}}", filters: [] },
  profileFilter: [NO_ORDER],
  reentry: null,
  entry: "split-option-1",
  actions: welcomeActions,
  variables: [
    { key: "lists.popup", description: "The list the pop-up adds subscribers to" },
    { key: "popup.property", description: "Profile property holding the pop-up answer" },
    { key: "popup.option_1", description: "Pop-up answer #1" },
    { key: "popup.option_2", description: "Pop-up answer #2" },
    { key: "popup.option_3", description: "Pop-up answer #3 (also catches anyone with no answer)" },
    { key: "offers.welcome", description: "Welcome offer W", example: "10%" },
    { key: "offers.welcome_code", description: "Welcome code", example: "BRAND10" },
    { key: "offers.welcome_upgrade", description: "W + 5 points", example: "15%" },
    { key: "offers.welcome_upgrade_code", description: "24-hour upgrade code", example: "BRAND15" },
    { key: "links.shop", description: "Shop link for SMS" },
  ],
  benchmarks: {},
  notes:
    "Klaviyo branches can't merge, so Emails #2–#5 and both SMS repeat on each of the three tracks (sameAs points to track A): write them once. SMS steps are skipped by Klaviyo for profiles without SMS consent, which replaces the docs' 'if subscribed to SMS' split.",
};

// ─── Site abandonment ───────────────────────────────────────────────────────────────────
const site: FlowFramework = {
  key: "site-abandonment",
  name: "Site Abandonment Flow (2 Emails)",
  version: 2,
  status: "active",
  tier: "core",
  appliesTo: ["replenishable", "one_off"],
  purpose: "Get them back onto the site and remind them the brand exists. Top of funnel: no new discount; mention the welcome offer only if they still hold it.",
  source: SRC,
  trigger: { type: "metric", source: "Active on Site", filters: [] },
  profileFilter: [
    { description: "Viewed Product zero times since starting this flow" },
    { description: "Added to Cart zero times since starting this flow" },
    { description: "Started Checkout zero times since starting this flow" },
    NO_ORDER,
    { description: "Not in the Browse Abandonment or Abandoned Cart flow (one retargeting flow at a time)" },
  ],
  reentry: { value: 7, unit: "days" },
  entry: "delay-1",
  actions: chain([
    { delay: [2, "hours"] },
    {
      email: {
        id: "email-1",
        name: "Email #1",
        job: "Answer a first-time visitor's questions and hook them on what makes the brand the brand",
        template: "site-abandonment/01-find-your-way",
        topic: "Were you just checking us out?",
        sendingTo: "Site visitors who left without viewing a product",
        offer: "None (welcome code only if still valid)",
        goals: {
          all: ["Hook them with what's popular about the brand: the unique mechanism or the reason the brand is the brand (BRAND)", "Social proof"],
          replenishable: ["Answer the questions a first-time visitor has"],
          one_off: ["Lead with helpfulness, not pressure: what the brand is, why people trust it", "Soft CTA (\"Find your setup\", \"Explore the collection\") or \"reply for help\""],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-2",
        name: "Email #2",
        job: "Best sellers and the problem each solves",
        template: "site-abandonment/02-best-sellers",
        topic: "Take a look at these best sellers",
        sendingTo: "Site visitors who left without viewing a product",
        offer: "None",
        goals: { all: ["Best sellers (DATA: what new customers buy first)"], replenishable: ["The problem each one solves"], one_off: ["One practical line each (best-selling products or categories)"] },
      },
    },
  ]),
  variables: [],
  benchmarks: {},
};

// ─── Browse abandonment ─────────────────────────────────────────────────────────────────
const browse: FlowFramework = {
  key: "browse-abandonment",
  name: "Browse Abandonment Flow (3 Emails + 1 SMS)",
  version: 2,
  status: "active",
  tier: "core",
  appliesTo: ["replenishable", "one_off"],
  purpose: "Window shoppers are comparing with competitors. Position the brand as the better, safer choice.",
  source: SRC,
  trigger: { type: "metric", source: "Viewed Product", filters: [] },
  profileFilter: [{ description: "Added to Cart zero times since starting this flow" }, { description: "Started Checkout zero times since starting this flow" }, NO_ORDER, { description: "Not in the Abandoned Cart flow" }],
  reentry: { value: 7, unit: "days" },
  entry: "delay-1",
  actions: chain([
    { delay: [2, "hours"] },
    {
      email: {
        id: "email-1",
        name: "Email #1: Reminder",
        job: "Show the viewed product and why this one beats the alternatives",
        template: "browse-abandonment/01-reminder",
        topic: "Still thinking about this?",
        sendingTo: "Window shoppers",
        dynamicBlock: "viewed-product",
        offer: "None",
        goals: {
          all: ["Dynamic block with the viewed product"],
          replenishable: ["Why this one beats the alternatives (ingredients, testing, results, value)"],
          one_off: ["Acknowledge it's a considered purchase", "Answer the doubt for that category (fit, sizing, compatibility, quality)", "Invite questions"],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-2",
        name: "Email #2: Reminder + Social Proof + Incentive",
        job: "Reviews for what they viewed, plus the browse incentive",
        template: "browse-abandonment/02-social-proof",
        topic: "Everyone is loving {{brand.name}}",
        sendingTo: "Window shoppers",
        dynamicBlock: "viewed-product",
        offer: "About W, smaller on high-ticket ({{offers.browse_code}})",
        goals: {
          all: ["Reviews tied to the viewed product or category", "The browse incentive (code + value)"],
          replenishable: ["Reduce friction: guarantee, free-shipping threshold"],
          one_off: ["Customer photos", "Keep the incentive light on high-ticket items", "Contact-us CTA for considered purchases"],
        },
      },
    },
    { sms: { id: "sms-1", job: "Simple reminder of what they were viewing", body: "Still thinking about {{event.ProductName}}? It's waiting for you: {{event.URL}}" } },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-3",
        name: "Email #3: Reminder + Incentive Expiry",
        job: "The viewed product is still waiting; the code expires tonight",
        template: "browse-abandonment/03-incentive",
        topic: "Sh… Don't tell anyone about this",
        sendingTo: "Window shoppers",
        dynamicBlock: "viewed-product",
        offer: "Same browse code, expiring tonight",
        goals: { all: ["The viewed product is still waiting", "The code expires tonight"], one_off: ["\"Buy right the first time\""] },
      },
    },
  ]),
  variables: [{ key: "offers.browse_code", description: "Browse code at about W", example: "BRAND10" }],
  benchmarks: {},
  notes: "SMS #1 follows Email #2 (what most reference docs do; a few pair it with Email #1).",
};

// ─── Abandoned cart ──────────────────────────────────────────────────────────────────────
const cart: FlowFramework = {
  key: "abandoned-cart",
  name: "Abandoned Cart Flow (4 Emails + 1 SMS)",
  version: 2,
  status: "active",
  tier: "core",
  appliesTo: ["replenishable", "one_off"],
  purpose: "Push them over the edge. They're already interested: remind them, add proof, then a mystery discount they can't resist.",
  source: { ...SRC, note: `${SRC.note}. Fluid's docs call this Abandoned Checkout; it triggers on Started Checkout and shows the cart in a dynamic table.` },
  trigger: { type: "metric", source: "Started Checkout", filters: [] },
  profileFilter: [NO_ORDER],
  reentry: { value: 1, unit: "days" },
  entry: "delay-1",
  actions: chain([
    { delay: [30, "minutes"] },
    {
      email: {
        id: "email-1",
        name: "Email #1: Simple Reminder",
        job: "Simple reminder, no discount",
        template: "abandoned-checkout/01-reminder",
        topic: "I think you forgot this…",
        sendingTo: "People who abandoned their cart",
        dynamicBlock: "checkout-items",
        offer: "None",
        structure: "Headline → Sub headline → Button → Dynamic Table → Button",
        goals: { all: ["Simple reminder, no discount", "Dynamic table showing their cart"] },
      },
    },
    { sms: { id: "sms-1", job: "Simple reminder about the items in their cart", body: "You left something in your cart at {{brand.name}}. Finish checking out: {{event.extra.checkout_url}}" } },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-2",
        name: "Email #2: Reminder + Social Proof",
        job: "Reviews for what's in the cart, plus the attach item",
        template: "abandoned-checkout/02-reviews",
        topic: "Here's what people are saying about {{brand.name}}",
        sendingTo: "People who abandoned their cart",
        dynamicBlock: "checkout-items",
        offer: "None",
        goals: {
          all: ["Dynamic table", "Bundle or attach item (DATA: what's most often bought with it)"],
          replenishable: ["Reviews for what's in the cart"],
          one_off: ["Reviews about quality, fit and service", "Expert help before they complete the order"],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-3",
        name: "Email #3: Mystery Discount",
        job: "Excitement and urgency: a mystery discount revealed at checkout",
        template: "abandoned-checkout/03-mystery-discount",
        topic: "Grab your MYSTERY Discount",
        sendingTo: "People who abandoned their cart",
        dynamicBlock: "checkout-items",
        offer: "Teaser above the real value: \"Get up to 30% off\", real 15% (20% when W is 15%+). Code MYSTERY",
        goals: { all: ["Excitement and urgency", "\"Get up to {{offers.mystery_teaser}} off\"; the code reveals the real value at checkout", "Code: {{offers.mystery_code}}"], one_off: ["State exclusions where they apply"] },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-4",
        name: "Email #4: Mystery Discount (last chance)",
        job: "The mystery code expires at midnight",
        template: "abandoned-checkout/04-last-chance",
        topic: "Last chance for your mystery discount",
        sendingTo: "People who abandoned their cart",
        dynamicBlock: "checkout-items",
        offer: "Same mystery code, expires at midnight",
        goals: { all: ["The code expires at midnight", "Dynamic table", "One checkout button"] },
      },
    },
  ]),
  variables: [
    { key: "offers.mystery_code", description: "Mystery discount code", example: "MYSTERY" },
    { key: "offers.mystery_teaser", description: "The 'up to' teaser", example: "30%" },
    { key: "offers.mystery_value", description: "Real value behind the code", example: "15%" },
  ],
  benchmarks: {},
};

// ─── Post-purchase ───────────────────────────────────────────────────────────────────────
const post: FlowFramework = {
  key: "post-purchase",
  name: "Post-Purchase Flow (4 Emails)",
  version: 2,
  status: "active",
  tier: "core",
  appliesTo: ["replenishable", "one_off"],
  purpose:
    "Replenishable: make the first order go well, teach them to use it, collect the review, drive the second order. One-off: make them glad they bought, get the review and photo, cross-sell into the next core product.",
  source: SRC,
  trigger: { type: "metric", source: "Placed Order", filters: [] },
  profileFilter: [{ description: "Placed Order equals 1 over all time (new customers)" }],
  reentry: null,
  entry: "delay-1",
  actions: chain([
    { delay: [5, "minutes"] },
    {
      email: {
        id: "email-1",
        name: "Email #1: Thank You + Order Confirmation",
        job: "Personal thank-you from the founder; no offer",
        template: "post-purchase/01-thank-you-plain",
        topic: "Thank you, {{first_name}}",
        format: "plain_text",
        sendingTo: "New customers",
        offer: "None",
        goals: {
          all: ["Plain text, from the founder", "Thank them for trusting the brand", "Build a personal connection", "Set shipping expectations so nobody has to email support", "Offer support", "Don't duplicate the store's transactional confirmation"],
          one_off: ["Offer help with sizing, setup, care or styling", "No second-purchase offer yet: reassurance and a good first impression"],
        },
      },
    },
    { delay: [1, "days"] },
    {
      email: {
        id: "email-2",
        name: "Email #2: How to use it / get the most out of it (+ second-purchase offer)",
        job: "Teach them to use what they bought; second-purchase code held below the teaching",
        template: "post-purchase/02-get-ready",
        topic: "How to get the best results from your {{event.ProductName}}",
        sendingTo: "New customers",
        offer: "Second-purchase code below the teaching ({{offers.second_purchase_code}}, 10–20% / 10–25%)",
        goals: {
          replenishable: [
            "How to use it for the best result: how much, when, with what, what to expect and when (category version in industries-replenishable.md)",
            "This is the email that protects the reorder: people who use it wrong don't see results",
            "Below the teaching: the second-purchase code; subscription or membership first if the client has it",
          ],
          one_off: [
            "The ownership guide for what they bought, per product type: apparel styling/try-on/care/exchanges; jewelry care/sizing/warranty/layering; home installation/placement/care; gear setup/safety/storage/maintenance; digital how-to",
            "Below the guide: the second-purchase code and complementary recommendations from the pairing map (DATA)",
          ],
        },
      },
    },
    { delay: [7, "days"] },
    {
      email: {
        id: "email-3",
        name: "Email #3: Plain text email from the founder",
        job: "The check-in only this brand can ask, plus the review ask",
        template: "post-purchase/03-check-in-plain",
        topic: "How's it going?",
        format: "plain_text",
        sendingTo: "New customers",
        offer: "None",
        goals: {
          all: ["Plain text from the founder", "Ask for the review at the moment they've formed an opinion", "Invite a reply so problems get caught early", "No discount, no product grid"],
          replenishable: ["\"How's it going?\" as the specific question only this brand can ask (\"Did you finish the can?\", \"Did the COA check out?\")"],
          one_off: ["The check-in (\"How did it go?\" after an occasion; \"I can't wait for you to wear it\")", "Ask for a review WITH a photo", "Warranty or upgrade reminders where they exist"],
        },
      },
    },
    { delay: [2, "days"] },
    {
      email: {
        id: "email-4",
        name: "Email #4: Upsell Offer",
        job: "Recommend the next product from what they bought",
        template: "post-purchase/04-complete-the-kit",
        topic: "Picked for you: what goes with your {{event.ProductName}}",
        sendingTo: "New customers",
        offer: "Second-purchase code with a clear expiry",
        goals: {
          replenishable: [
            "Recommend the next product written as a pairing map: Bought X → Y and Z (DATA: product paths)",
            "The second-purchase code",
            "Subscription, bundle or volume set as the better standing deal",
            "Free-shipping threshold as a basket builder",
          ],
          one_off: [
            "Cross-sell into a complementary core product as pairing modules (DATA): e.g. Chain + Bracelet; kayaks → paddles, PFDs, roof racks",
            "\"Need another color?\" for single-style hits",
            "Second-purchase code with a clear expiry; any ongoing bundle offer as the alternative",
          ],
        },
      },
    },
  ]),
  variables: [{ key: "offers.second_purchase_code", description: "Second-purchase code", example: "SECOND15" }],
  benchmarks: {},
};

// ─── Winback ─────────────────────────────────────────────────────────────────────────────
const winback: FlowFramework = {
  key: "winback",
  name: "Winback Flow (2 Emails)",
  version: 2,
  status: "active",
  tier: "core",
  appliesTo: ["replenishable", "one_off"],
  purpose: "Bring back first-time customers who never ordered again, timed to the brand's real lifecycle: past the natural reorder point, before the habit is gone.",
  source: SRC,
  trigger: { type: "metric", source: "Placed Order", filters: [] },
  profileFilter: [{ description: "Placed Order equals 1 over all time (first-time customers)" }, NO_ORDER],
  reentry: null,
  entry: "delay-1",
  actions: chain([
    { delay: [90, "days", "winback_days"] },
    {
      email: {
        id: "email-1",
        name: "Email #1: We miss you",
        job: "What's new, what they bought before, and the winback code",
        template: "winback/01b-check-in-designed",
        topic: "We miss you, {{first_name}}",
        sendingTo: "First-time customers who have never purchased again",
        offer: "Winback code, the ceiling offer (15–25%, or $50): {{offers.winback_code}}",
        goals: {
          replenishable: [
            "What's changed since they left (new products, flavors, batches)",
            "Reorder block with what they bought before",
            "The winback code",
            "An easy way to tell the brand if something went wrong",
          ],
          one_off: [
            "New arrivals and refreshed best sellers",
            "Recommendations based on what they bought before (dynamic)",
            "The reason they chose the brand",
            "Coming back should feel like a style refresh or upgrade, never a clearance event",
            "The winback code",
          ],
        },
      },
    },
    { delay: [5, "days"] },
    {
      email: {
        id: "email-2",
        name: "Email #2: Come back offer",
        job: "Same code with a clear expiry",
        template: "winback/02-come-back-offer",
        topic: "Your offer expires soon",
        sendingTo: "First-time customers who have never purchased again",
        offer: "Same winback code, clear expiry",
        goals: {
          all: ["The same code with a clear expiry"],
          replenishable: ["Best sellers or the bundle", "Subscription for anyone who'd otherwise lapse again"],
          one_off: ["One primary CTA to their recommended collection", "Exclusions stated"],
        },
      },
    },
  ]),
  variables: [
    {
      key: "winback_days",
      description:
        "Days after first order. DATA: where ~70% of repeat orders have happened. Replenishable: past the reorder point (30-day supply → ~45 days); split by product group when cycles differ (SPQR 60/90). One-off: 60–180, 90 most often; split by segment",
      example: "90",
    },
    { key: "offers.winback_code", description: "Winback code", example: "COMEBACK20" },
  ],
  benchmarks: {},
  notes: "Email #2 lands 3–7 days after #1 (replenishable) or 3–14 (one-off); 5 is the default. Liquid Surf used plain text for a check-in tone (template winback/01a-check-in-plain).",
};

// ─── Optional (replenishable) ───────────────────────────────────────────────────────────
const replenishment: FlowFramework = {
  key: "replenishment",
  name: "Replenishment Flow (2 Emails + 1 SMS)",
  version: 2,
  status: "draft",
  tier: "optional",
  appliesTo: ["replenishable"],
  purpose: "Catch the reorder at the moment they run out. Propose only when the data shows a real same-product reorder habit and no replenishment flow is running.",
  source: { ...SRC, note: `${SRC.note}. As run for EVO Labs and PeptiNova.` },
  trigger: { type: "metric", source: "Placed Order", filters: [{ description: "Per product group (one flow or trigger split per group)" }] },
  profileFilter: [NO_ORDER, { description: "Not in the Abandoned Cart flow" }, { description: "Not an active subscriber (they get a member version or nothing)" }],
  reentry: { value: 1, unit: "days" },
  entry: "delay-1",
  actions: chain([
    { delay: [30, "days", "replenish_days"] },
    {
      email: {
        id: "email-1",
        name: "Email #1: Running low?",
        job: "Reorder at full price at the moment they run out",
        template: "replenishment/01-running-low",
        topic: "Running low on {{event.ProductName}}?",
        sendingTo: "Customers at their product group's reorder window",
        offer: "None: a customer who's genuinely low reorders at full price",
        goals: { all: ["Dynamic reorder block", "Attach items", "Subscription"] },
      },
    },
    { sms: { id: "sms-1", job: "Reorder reminder", body: "Running low on {{event.ProductName}}? Reorder in one tap: {{links.reorder}}" } },
    { delay: [6, "days"] },
    {
      email: {
        id: "email-2",
        name: "Email #2: Last call before you run out",
        job: "Restock code with a 72-hour expiry",
        template: "replenishment/02-last-call",
        topic: "Last call before you run out",
        sendingTo: "Customers who haven't reordered",
        offer: "~15% restock code, 72-hour expiry ({{offers.restock_code}})",
        goals: { all: ["Restock code with 72-hour expiry", "Bundle or volume set side by side as the smarter option"] },
      },
    },
  ]),
  variables: [
    { key: "replenish_days", description: "DATA: each product group's median days to second order (EVO: 21 / 30 / 45 by format)", example: "30" },
    { key: "links.reorder", description: "Reorder link" },
    { key: "offers.restock_code", description: "Restock code", example: "RESTOCK15" },
  ],
  benchmarks: {},
};

const sunset: FlowFramework = {
  key: "sunset",
  name: "Sunset / Re-engagement Flow (3 Emails)",
  version: 2,
  status: "draft",
  tier: "optional",
  appliesTo: ["replenishable", "one_off"],
  purpose: "Protect sender reputation on large imported or inactive lists: re-engage, then unsubscribe non-confirmers. As run for Beyond Slim.",
  source: SRC,
  trigger: { type: "segment", source: "{{segments.unengaged_120}}", filters: [] },
  profileFilter: [{ description: "No opens, clicks or purchases in the last 120 days" }],
  reentry: null,
  entry: "email-1",
  actions: chain([
    { email: { id: "email-1", name: "Email #1: We miss you", job: "Re-engage with an incentive", template: "sunset/01-we-miss-you", topic: "We miss you", sendingTo: "Unengaged 120 days", offer: "An incentive", goals: { all: ["We miss you", "An incentive to come back"] } } },
    { delay: [5, "days"] },
    { email: { id: "email-2", name: "Email #2: Last chance to stay connected", job: "Last chance", template: "sunset/02-last-chance", topic: "Last chance to stay connected", sendingTo: "Still unengaged", goals: { all: ["Last chance to stay on the list"] } } },
    { delay: [3, "days"] },
    { email: { id: "email-3", name: "Email #3: Confirm you want to hear from us", job: "Plain-text confirm; non-confirmers get unsubscribed", template: "sunset/03-confirm-plain", topic: "Should we stop emailing you?", format: "plain_text", sendingTo: "Still unengaged", goals: { all: ["Plain text", "Click to confirm you want to hear from us", "Non-confirmers are unsubscribed to protect sender reputation"] } } },
  ]),
  variables: [{ key: "segments.unengaged_120", description: "Segment: no opens, clicks or orders in 120 days" }],
  benchmarks: {},
};

// ─── System: offer ladder + flow rules ──────────────────────────────────────────────────
const system = {
  version: 2,
  source: SRC.note,
  coreFlows: ["popup", "welcome", "site-abandonment", "browse-abandonment", "abandoned-cart", "post-purchase", "winback"],
  optionalFlows: ["replenishment", "sunset"],
  versions: {
    replenishable: "Used up and rebought (supplements, peptides, skin/hair care, cosmetics, CPG). Post-purchase teaches use; upsell = reorder / next step in the routine; winback when supply runs out.",
    one_off: "Lasts (apparel, jewelry, home, gear, digital). Post-purchase makes them glad they bought; upsell = complementary core product; winback = longer style-refresh / upgrade window.",
  },
  offerLadder: [
    { where: "Pop-up, Welcome #1–#4, SMS #1", default: "W (5–20%, most often 10%; $ off or no discount for high-ticket / expert-led one-off brands)" },
    { where: "Welcome #5 + SMS #2", default: "W + 5 points for 24 hours (dollar offers double)" },
    { where: "Site Abandonment", default: "None (welcome code mentioned if still valid)" },
    { where: "Browse #2–#3", default: "About W; smaller on high-ticket" },
    { where: "Abandoned Cart #3–#4", default: "Mystery: teaser above the real value. 'Up to 30%' → real 15% (20% when W ≥ 15%)" },
    { where: "Post-Purchase #2 and #4", default: "Second-purchase code 10–20% (one-off up to 25%)" },
    { where: "Winback #1–#2", default: "The ceiling: 15–25% (or $50)" },
    { where: "Replenishment #2 (optional)", default: "~15%, 72-hour expiry; none in #1" },
  ],
  offerRules: [
    "Every amount is proposed for client approval",
    "Subscription, membership and rewards lead where the client has them; codes become the fallback",
    "High-ticket brands discount less, or in dollars; state exclusions (MAP, custom quotes)",
    "Ongoing offers sit beside codes, never stacked: 'codes can't be combined'",
    "Gift framing over discount framing for emotional / occasion purchases",
  ],
  flowRules: [
    "A purchase exits Welcome, Site Abandonment, Browse Abandonment and Abandoned Cart",
    "One retargeting flow at a time, by intent: Cart beats Browse, Browse beats Site Abandonment",
    "Flow filter on Welcome and the abandonment flows: placed order 0 times since starting the flow. Smart Sending off",
    "Re-entry off for Welcome; on for the abandonment flows",
    "Non-converters from the discount flows are suppressed from further flow discounts for a period (LEVL: 60 days)",
    "SMS only to contacts with SMS consent",
    "Category rules from the industries files (peptide compliance review before every send, age gating, claims rules)",
    "One-off: offer exclusions stated on every email that carries a code",
  ],
};

async function main() {
  await mkdir("brain/flows", { recursive: true });
  let bad = 0;
  for (const f of [welcome, site, browse, cart, post, winback, replenishment, sunset]) {
    const parsed = FlowFrameworkSchema.parse(f);
    const errors = validateFramework(parsed);
    if (errors.length) {
      bad++;
      console.error(`✗ ${f.key}\n  ${errors.join("\n  ")}`);
    }
    await writeFile(`brain/flows/${f.key}.json`, JSON.stringify(parsed, null, 2) + "\n");
    const emails = parsed.actions.filter((a) => a.type === "send-email" && !a.sameAs).length;
    const sms = parsed.actions.filter((a) => a.type === "send-sms" && !a.sameAs).length;
    console.log(`✓ ${f.key.padEnd(20)} ${emails} emails, ${sms} SMS, ${parsed.actions.length} steps`);
  }
  await writeFile("brain/flows/popup.json", JSON.stringify(PopupSchema.parse(popup), null, 2) + "\n");
  await writeFile("brain/flows/system.json", JSON.stringify(system, null, 2) + "\n");
  console.log("✓ popup, system");
  if (bad) process.exit(1);
}

main();
