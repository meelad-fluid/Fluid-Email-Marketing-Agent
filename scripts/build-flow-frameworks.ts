// ARCHIVED 2026-11-16: the Dolce-Klaviyo-derived frameworks, now in brain/flows/archive/dolce-klaviyo/. Fluid's live system is scripts/build-core-flows.ts.
//
// Source: Fluid-built flows in the reference Klaviyo account (exported 2026-10-20), with timing,
// splits and filters kept as built, minus four fixes Fluid approved:
//   - Winback waits after the order before checking for a repeat purchase (as built, it sent to nobody)
//   - Welcome: every path uses the same splits (one path had an inverted "placed order" check)
//   - Site Abandonment excludes people who viewed a product, added to cart or started checkout
//   - Replenishment drops people who reorder
// Abandoned Cart = Abandoned Checkout's structure, triggered by Added to Cart, with the cart dynamic table.
//
// Fluid's shared pattern is written once here (gates, open split + resend, SMS branch) so every
// flow stays consistent. Run: npm run brain:flows

import { access, mkdir, writeFile } from "node:fs/promises";
import { FlowFrameworkSchema, validateFramework, type FlowAction, type FlowFramework } from "../lib/flows/framework";

// ─── Klaviyo conditions ─────────────────────────────────────────────────────
// Metric and list ids differ per account, so they're named placeholders the builder resolves
// in each client's account: {{metric:Placed Order}}, {{list:newsletter}}.

const flowStart = { type: "date", operator: "flow-start" };
const lastDays = (quantity: number) => ({ type: "date", operator: "in-the-last", unit: "day", quantity });

const metricCount = (metric: string, operator: string, value: number, timeframe: object | null) => ({
  type: "profile-metric",
  metric_id: `{{metric:${metric}}}`,
  measurement: "count",
  measurement_filter: { type: "numeric", operator, value },
  timeframe_filter: timeframe,
  metric_filters: null,
});

const cond = (description: string, klaviyo: unknown) => ({ description, klaviyo });

const C = {
  noOrderSinceStart: cond("Placed Order zero times since starting this flow", metricCount("Placed Order", "equals", 0, flowStart)),
  noCheckoutSinceStart: cond("Checkout Started zero times since starting this flow", metricCount("Checkout Started", "equals", 0, flowStart)),
  noCartSinceStart: cond("Added to Cart zero times since starting this flow", metricCount("Added to Cart", "equals", 0, flowStart)),
  noViewSinceStart: cond("Viewed Product zero times since starting this flow", metricCount("Viewed Product", "equals", 0, flowStart)),
  openedSinceStart: cond("Opened Email at least once since starting this flow", metricCount("Opened Email", "greater-than", 0, flowStart)),
  noOpenSinceStart: cond("Opened Email zero times since starting this flow", metricCount("Opened Email", "equals", 0, flowStart)),
  noClickSinceStart: cond("Clicked Email zero times since starting this flow", metricCount("Clicked Email", "equals", 0, flowStart)),
  canSms: cond("Can receive SMS marketing", {
    type: "profile-marketing-consent",
    consent: { channel: "sms", can_receive_marketing: true, consent_status: { subscription: "subscribed", filters: null } },
  }),
  notInFlowDays: (n: number) => cond(`Has not been in this flow in the last ${n} days`, { type: "profile-not-in-flow", timeframe_filter: lastDays(n) }),
  ordersOverAllTime: (operator: "equals" | "greater-than", n: number) =>
    cond(`Placed Order ${operator === "equals" ? "exactly" : "more than"} ${n} times over all time`, metricCount("Placed Order", operator, n, null)),
  excludeCustomerTags: cond("Shopify Tags don't contain any of {{exclusions.customer_tags}} (wholesale, test accounts)", {
    type: "profile-property",
    property: "properties['Shopify Tags']",
    filter: { type: "list", operator: "not-contains-any", value: "{{exclusions.customer_tags}}" },
  }),
  answer: (key: string) =>
    cond(`Pop-up answer ({{popup.property}}) = {{${key}}}`, {
      type: "profile-property",
      property: "properties['{{popup.property}}']",
      filter: { type: "string", operator: "equals", value: `{{${key}}}` },
    }),
};

// ─── Step builder ───────────────────────────────────────────────────────────
// Flows are written as readable step lists and compiled into linked Klaviyo-style actions.

type Unit = "minutes" | "hours" | "days";
type Email = { kind: "email"; key: string; job: string; template: string; subject: string[]; preview?: string; dynamicBlock?: "cart-items" | "checkout-items" | "viewed-product"; resend?: boolean };
type Step =
  | { kind: "delay"; value: number; unit: Unit }
  | Email
  | { kind: "sms"; key: string; job: string; body: string }
  | { kind: "profile"; property: string; value: string }
  | { kind: "gate"; cond: ReturnType<typeof cond> } // continue only if true, else the branch ends
  | { kind: "optional"; cond: ReturnType<typeof cond>; steps: Step[] } // run steps if true, then everyone rejoins
  | { kind: "split"; cond: ReturnType<typeof cond>; yes: Step[]; no: Step[] }; // must be the last step of its list

const wait = (value: number, unit: Unit): Step => ({ kind: "delay", value, unit });
const noOrderGate: Step = { kind: "gate", cond: C.noOrderSinceStart };
const smsIfSubscribed = (key: string, job: string, body: string): Step => ({ kind: "optional", cond: C.canSms, steps: [{ kind: "sms", key, job, body }] });
const resendOf = (e: Email): Email => ({ ...e, key: `${e.key}-resend`, resend: true, job: `Resend of "${e.job}" to people who didn't open it` });
const lastFlow = (name: string): Step => ({ kind: "profile", property: "Last Flow", value: name });

function compile(steps: Step[]): { entry: string; actions: FlowAction[] } {
  const actions: FlowAction[] = [];
  const counts: Record<string, number> = {};
  const newId = (p: string) => `${p}-${(counts[p] = (counts[p] ?? 0) + 1)}`;
  const emailIds = new Map<string, string>();

  // Build back to front so each action knows what comes next.
  function build(list: Step[], tail: string | null): string | null {
    let next = tail;
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i];
      if (s.kind === "split" && i !== list.length - 1) throw new Error("A split must be the last step in its list");
      switch (s.kind) {
        case "delay": {
          const id = newId("delay");
          actions.push({ id, type: "time-delay", delay: { value: s.value, unit: s.unit }, next });
          next = id;
          break;
        }
        case "email": {
          const id = s.key;
          emailIds.set(s.key, id);
          actions.push({
            id, type: "send-email", job: s.job, template: s.template, subject: s.subject, preview: s.preview, smartSending: false,
            dynamicBlock: s.dynamicBlock, resendOf: s.resend ? s.key.replace(/-resend$/, "") : undefined, next,
          });
          next = id;
          break;
        }
        case "sms": {
          actions.push({ id: s.key, type: "send-sms", job: s.job, body: s.body, next });
          next = s.key;
          break;
        }
        case "profile": {
          const id = newId("update-profile");
          actions.push({ id, type: "update-profile", property: s.property, value: s.value, next });
          next = id;
          break;
        }
        case "gate": {
          const id = newId("split");
          actions.push({ id, type: "conditional-split", condition: s.cond, next_if_true: next, next_if_false: null });
          next = id;
          break;
        }
        case "optional": {
          const id = newId("split");
          const yes = build(s.steps, next);
          actions.push({ id, type: "conditional-split", condition: s.cond, next_if_true: yes, next_if_false: next });
          next = id;
          break;
        }
        case "split": {
          const id = newId("split");
          const yes = build(s.yes, null);
          const no = build(s.no, null);
          actions.push({ id, type: "conditional-split", condition: s.cond, next_if_true: yes, next_if_false: no });
          next = id;
          break;
        }
      }
    }
    return next;
  }
  const entry = build(steps, null);
  if (!entry) throw new Error("Empty flow");
  return { entry, actions: actions.reverse() };
}

// Steps repeated on a second track need their own ids.
function suffixKeys(steps: Step[], suffix: string): Step[] {
  return steps.map((s) =>
    s.kind === "email" || s.kind === "sms" ? { ...s, key: s.key + suffix }
    : s.kind === "optional" ? { ...s, steps: suffixKeys(s.steps, suffix) }
    : s.kind === "split" ? { ...s, yes: suffixKeys(s.yes, suffix), no: suffixKeys(s.no, suffix) }
    : s);
}

// Fluid's abandonment pattern: email 1 → (SMS) → check → people who opened continue; people who
// didn't get email 1 again, and if they still don't open they're tagged with Last Flow and exit.
function openSplitTrack(o: {
  first: Email;
  sms?: Step;
  checkAfter: [number, Unit];
  openerDelay?: [number, Unit];
  resendDelay: [number, Unit];
  rest: { delay: [number, Unit]; email: Email }[]; // emails 2+, each with the wait before it
  after?: Step[]; // runs after the last email on both tracks (e.g. SMS #2)
  resendNeedsOpen: boolean; // after the resend, require an open to continue
  lastFlowName?: string;
}): Step[] {
  const track = (resend: boolean): Step[] =>
    o.rest.flatMap((r, i) => [
      ...(i === 0 ? (resend || !o.openerDelay ? [] : [wait(...o.openerDelay)]) : [wait(...r.delay)]),
      noOrderGate,
      resend ? { ...r.email, key: `${r.email.key}-b`, job: `${r.email.job} (resend track)` } : r.email,
    ]).concat(resend ? suffixKeys(o.after ?? [], "-b") : o.after ?? []);

  const resendTrack: Step[] = o.resendNeedsOpen
    ? [{ kind: "split", cond: C.openedSinceStart, yes: track(true), no: o.lastFlowName ? [lastFlow(o.lastFlowName)] : [] }]
    : track(true);

  return [
    o.first,
    ...(o.sms ? [o.sms] : []),
    wait(...o.checkAfter),
    noOrderGate,
    {
      kind: "split",
      cond: C.openedSinceStart,
      yes: track(false),
      no: [resendOf(o.first), wait(...o.resendDelay), ...resendTrack],
    },
  ];
}

// ─── Frameworks ─────────────────────────────────────────────────────────────

const email = (key: string, job: string, template: string, subject: string[], extra: Partial<Email> = {}): Email => ({ kind: "email", key, job, template, subject, ...extra });

type Def = Omit<FlowFramework, "entry" | "actions" | "version" | "status" | "source"> & { steps: Step[] };

const commonVars = {
  newsletter: { key: "lists.newsletter", description: "The main email list the sign-up pop-up adds people to", example: "Newsletter" },
  tags: { key: "exclusions.customer_tags", description: "Shopify customer tags to exclude (wholesale, test, partner accounts)", example: "wholesale, ISTEST" },
};

function welcome(): Def {
  const branch = (n: 1 | 2 | 3): Step[] => {
    const tag = `-o${n}`;
    return openSplitTrack({
      first: email(`welcome-1${tag}`, `Welcome offer, angled to pop-up answer #${n}: welcome to the brand, give the {{discount.welcome_value}} code, brand mission, the benefit they picked, best sellers`, "welcome/01-welcome-offer", [`{{copy.welcome_subject_${n}}}`]),
      sms: smsIfSubscribed(`welcome-sms-1${tag}`, "Welcome them to the brand and give them the welcome offer", "Welcome to {{brand.name}}! Here's {{discount.welcome_value}} off your first order: {{discount.welcome_code}}"),
      checkAfter: [3, "hours"],
      openerDelay: [4, "hours"],
      resendDelay: [21, "hours"],
      rest: [
        { delay: [4, "hours"], email: email(`welcome-2${tag}`, "Personal note from the founder: why the brand exists", "welcome/02a-founder-note-plain", ["{{copy.founder_subject}}"]) },
        { delay: [1, "days"], email: email(`welcome-3${tag}`, "Customer reviews: build trust, remind them of the discount, inspirational and reassuring", "welcome/03-reviews", ["What our customers are raving about"]) },
        { delay: [1, "days"], email: email(`welcome-4${tag}`, "Best seller showcase", "welcome/04-best-sellers", ["{{copy.bestseller_subject}}"]) },
        { delay: [1, "days"], email: email(`welcome-5${tag}`, "Upgrade the offer from {{discount.welcome_value}} to {{discount.upgrade_value}} for 24 hours only", "welcome/05-upgrade-offer", ["We upgraded your discount…but keep it quiet"]) },
      ],
      after: [smsIfSubscribed(`welcome-sms-2${tag}`, "Upgraded discount, 24 hours only", "Your discount just got upgraded: {{discount.upgrade_value}} off with {{discount.upgrade_code}} for the next 24 hours.")],
      resendNeedsOpen: true,
      lastFlowName: "Welcome",
    });
  };
  return {
    key: "welcome",
    name: "Welcome Flow",
    purpose: "Convert new subscribers with a welcome offer, build trust (founder, reviews, best sellers), and close with an upgraded 24-hour offer. Email 1 is angled to the answer they picked in the pop-up.",
    trigger: { type: "list", source: "{{lists.newsletter}}", filters: [] },
    // As built this was "no order OR no checkout", which in practice meant "no order". Written plainly here.
    profileFilter: [C.noOrderSinceStart],
    reentry: null,
    steps: [
      {
        kind: "split",
        cond: C.answer("popup.option_1"),
        yes: branch(1),
        no: [{ kind: "split", cond: C.answer("popup.option_2"), yes: branch(2), no: branch(3) }],
      },
    ],
    variables: [
      commonVars.newsletter,
      { key: "popup.property", description: "Profile property the pop-up saves the zero-party answer to", example: "Looking For" },
      { key: "popup.option_1", description: "Pop-up answer #1", example: "Better Prices" },
      { key: "popup.option_2", description: "Pop-up answer #2", example: "Reliable Source" },
      { key: "popup.option_3", description: "Pop-up answer #3 (also gets anyone who didn't answer)", example: "High Quality Ingredients" },
      { key: "discount.welcome_code", description: "Welcome offer code", example: "WELCOME10" },
      { key: "discount.welcome_value", description: "Welcome offer", example: "10%" },
      { key: "discount.upgrade_code", description: "24-hour upgraded offer code", example: "UPGRADE20" },
      { key: "discount.upgrade_value", description: "Upgraded offer (must be within the client's max discount)", example: "20%" },
      { key: "copy.welcome_subject_1", description: "Email 1 subject for answer #1", example: "Superfoods without the super prices? Welcome home" },
      { key: "copy.welcome_subject_2", description: "Email 1 subject for answer #2", example: "Superfoods that work as hard as you do" },
      { key: "copy.welcome_subject_3", description: "Email 1 subject for answer #3", example: "Superfoods for your health journey…without the super price" },
      { key: "copy.founder_subject", description: "Founder story subject", example: "What I learned from six months in Madagascar" },
      { key: "copy.bestseller_subject", description: "Best seller subject", example: "The coffee that redefines “instant”" },
    ],
    benchmarks: { "reference revenue per recipient": "$6.45", "reference order rate": "4.3%" },
    notes: "The three answer paths are identical apart from email 1's angle. Fix vs reference account: every path now uses the same splits (one path had an inverted 'placed order' check that stopped emails 4–5 on the resend track).",
  };
}

function siteAbandonment(): Def {
  return {
    key: "site-abandonment",
    name: "Site Abandonment",
    purpose: "Bring back people who landed on the site but didn't view a product, add to cart or start checkout, and get them exploring the catalog.",
    trigger: { type: "metric", source: "Active on Site", filters: [] },
    // Fix vs reference account: it had no filter, so people also in Browse / Cart / Checkout got both.
    profileFilter: [C.noViewSinceStart, C.noCartSinceStart, C.noCheckoutSinceStart, C.noOrderSinceStart],
    reentry: { value: 30, unit: "days" },
    steps: openSplitTrack({
      first: email("site-1", "Were you just checking us out? Invite them back to explore", "site-abandonment/01-find-your-way", ["We saved your picks…ready when you are"]),
      checkAfter: [3, "hours"],
      resendDelay: [21, "hours"],
      openerDelay: [21, "hours"],
      rest: [{ delay: [21, "hours"], email: email("site-2", "Take a look at these best sellers", "site-abandonment/02-best-sellers", ["{{copy.site_bestseller_subject}}"]) }],
      resendNeedsOpen: false,
    }),
    variables: [{ key: "copy.site_bestseller_subject", description: "Best sellers subject", example: "Superfoods harvested by hand, priced for real life" }],
    benchmarks: { "reference revenue per recipient": "$2.10", "reference order rate": "0.54%" },
    notes: "Email 1 sends 2 hours after the visit. Fix vs reference account: added the filter excluding product views, add to cart and checkout.",
  };
}

function browseAbandonment(): Def {
  return {
    key: "browse-abandonment",
    name: "Browse Abandonment",
    purpose: "Retarget window shoppers who viewed a product but didn't add to cart: product reminder, social proof, then an incentive.",
    trigger: { type: "metric", source: "Viewed Product", filters: [] },
    profileFilter: [C.noCartSinceStart, C.noCheckoutSinceStart, C.noOrderSinceStart, C.notInFlowDays(30)],
    reentry: { value: 30, unit: "days" },
    steps: openSplitTrack({
      first: email("browse-1", "Reminder of the product they viewed", "browse-abandonment/01-reminder", ["Still debating? Let’s make it simple"], { dynamicBlock: "viewed-product" }),
      sms: smsIfSubscribed("browse-sms-1", "Simple reminder about the items they were viewing", "Left something behind? We don’t blame you…it’s hard to resist {{ event.ProductName }}."),
      checkAfter: [3, "hours"],
      openerDelay: [21, "hours"],
      resendDelay: [21, "hours"],
      rest: [
        { delay: [21, "hours"], email: email("browse-2", "Reminder + social proof + incentive: everyone is loving {{brand.name}}", "browse-abandonment/02-social-proof", ["Don’t take our word for it…see what others are saying"], { dynamicBlock: "viewed-product" }) },
        { delay: [1, "days"], email: email("browse-3", "Reminder + incentive with an expiry", "browse-abandonment/03-incentive", ["A little nudge (with {{discount.browse_value}} off) to seal the deal"], { dynamicBlock: "viewed-product" }) },
      ],
      resendNeedsOpen: true,
      lastFlowName: "Browse Abandonment",
    }),
    variables: [
      { key: "discount.browse_code", description: "Browse abandonment incentive code", example: "TAKE10" },
      { key: "discount.browse_value", description: "Browse abandonment incentive", example: "10%" },
    ],
    benchmarks: { "reference revenue per recipient": "$1.13", "reference order rate": "0.62%" },
    notes: "Email 1 sends 2 hours after the product view. 'Added to Cart zero times' is new: the reference account had no cart flow, and without it a shopper who adds to cart would get Browse and Cart at once.",
  };
}

function cartOrCheckout(kind: "cart" | "checkout"): Def {
  const isCart = kind === "cart";
  const k = isCart ? "cart" : "checkout";
  const block = isCart ? ("cart-items" as const) : ("checkout-items" as const);
  const name = isCart ? "Abandoned Cart" : "Abandoned Checkout";
  return {
    key: `abandoned-${k}`,
    name,
    purpose: isCart
      ? "Convert people who added to cart but didn't start checkout. Same structure as Abandoned Checkout; the dynamic table shows the Added to Cart items."
      : "Convert people who started checkout but didn't order: urgency, simplicity, reviews, then a mystery discount.",
    trigger: { type: "metric", source: isCart ? "Added to Cart" : "Checkout Started", filters: [] },
    profileFilter: isCart ? [C.noCheckoutSinceStart, C.noOrderSinceStart, C.notInFlowDays(7)] : [C.noOrderSinceStart, C.notInFlowDays(7)],
    reentry: { value: 7, unit: "days" },
    steps: openSplitTrack({
      first: email(`${k}-1`, `Simple reminder to get them back. Structure: headline, sub-headline, button, dynamic ${isCart ? "cart" : "checkout"} table, button`, "abandoned-checkout/01-reminder", ["Your cart’s looking a little lonely…", "I think you forgot this…"], { dynamicBlock: block }),
      sms: smsIfSubscribed(`${k}-sms-1`, "Simple reminder about the items in their cart", "Still thinking it over? Your {{brand.name}} cart hasn’t given up on you: {{ checkout_url }}"),
      checkAfter: [1, "hours"],
      openerDelay: [3, "hours"],
      resendDelay: [3, "hours"],
      rest: [
        { delay: [3, "hours"], email: email(`${k}-2`, "Reminder + social proof: their items plus reviews and testimonials", "abandoned-checkout/02-reviews", ["Can’t decide? Let the reviews do the talking"], { dynamicBlock: block }) },
        { delay: [1, "days"], email: email(`${k}-3`, "Mystery discount: create excitement and urgency (get up to {{discount.mystery_value}} off)", "abandoned-checkout/03-mystery-discount", ["Your cart’s still dreaming…here’s a little mystery to sweeten the deal", "Grab your MYSTERY discount"], { dynamicBlock: block }) },
        { delay: [1, "days"], email: email(`${k}-4`, "Last chance: the mystery discount expires at midnight", "abandoned-checkout/04-last-chance", ["Your mystery discount turns into a pumpkin at midnight"], { dynamicBlock: block }) },
      ],
      resendNeedsOpen: true,
      lastFlowName: name,
    }),
    variables: [
      { key: "discount.mystery_code", description: "Mystery discount code", example: "MYSTERY" },
      { key: "discount.mystery_value", description: "Mystery discount (up to the client's max discount)", example: "15%" },
    ],
    benchmarks: isCart ? {} : { "reference revenue per recipient": "$6.92", "reference order rate": "2.8%" },
    notes: `Email 1 sends 30 minutes after the trigger. ${isCart ? "Excludes anyone who has started checkout so they move to Abandoned Checkout instead. The only difference from Checkout is the dynamic table (cart items from the Added to Cart event)." : "Uses the checkout line items for the dynamic table."}`,
  };
}

function postPurchase(): Def {
  return {
    key: "post-purchase",
    name: "Post-Purchase",
    purpose: "Improve the customer journey: thank them, help them use the product, check in, and upsell.",
    trigger: { type: "metric", source: "Placed Order", filters: [] },
    profileFilter: [C.noOrderSinceStart, C.excludeCustomerTags],
    reentry: null,
    steps: [
      wait(5, "minutes"),
      email("post-1", "Thank you + order confirmation, from the founder: thank them for trusting us, personal connection, offer support", "post-purchase/01-thank-you-plain", ["Your {{brand.name}} order is confirmed"]),
      wait(1, "days"),
      email("post-2", "How to use the product, or an upsell", "post-purchase/02-get-ready", ["{{copy.post_upsell_subject}}"]),
      wait(10, "days"),
      email("post-3", "Plain-text check-in from the founder", "post-purchase/03-check-in-plain", ["Just checking in…how’s everything tasting?"]),
      wait(2, "days"),
      email("post-4", "Upsell offer / thank-you gift", "post-purchase/04-complete-the-kit", ["A little thank-you gift, straight from the source"]),
    ],
    variables: [commonVars.tags, { key: "copy.post_upsell_subject", description: "Email 2 subject", example: "Round out your pantry & skip the shipping cost" }],
    benchmarks: { "reference revenue per recipient": "$1.91", "reference order rate": "0.69%" },
  };
}

function winback(): Def {
  return {
    key: "winback",
    name: "Winback",
    purpose: "Re-engage lapsed customers and get a repeat purchase, timed to the brand's usual time between orders.",
    trigger: { type: "metric", source: "Placed Order", filters: [] },
    // Fix vs reference account: it checked "no order in 90 days" 5 minutes after the order that
    // triggered it, so everyone was filtered out (0 sends in a year). Now it waits first, and every
    // new order starts a fresh entry while the older one exits.
    profileFilter: [C.noOrderSinceStart],
    reentry: { value: 1, unit: "days" },
    steps: [
      wait(90, "days"), // {{winback.days_after_order}}, set per client
      email("winback-1", "We miss you: remind them of the ritual/benefit", "winback/01a-check-in-plain", ["Your {{copy.winback_ritual}} awaits its next chapter"]),
      wait(5, "days"),
      email("winback-2", "Reignite: re-sell the core benefits", "winback/01b-check-in-designed", ["Reignite your ritual"]),
      wait(7, "days"),
      email("winback-3", "Come-back offer: {{discount.winback_value}} off, 3 days left", "winback/02-come-back-offer", ["3 days left to restock your favorites"]),
      wait(2, "days"),
      email("winback-4", "Come-back offer ending in 48 hours", "winback/02-come-back-offer", ["{{discount.winback_value}} off ends in 48 hours"]),
    ],
    variables: [
      { key: "winback.days_after_order", description: "Days after the last order before winback starts (the brand's typical time between orders)", example: "90" },
      { key: "discount.winback_code", description: "Come-back offer code", example: "COMEBACK15" },
      { key: "discount.winback_value", description: "Come-back offer", example: "15%" },
      { key: "copy.winback_ritual", description: "What the customer's routine with the product is called", example: "superfood ritual" },
    ],
    benchmarks: {},
    notes: "The first wait is {{winback.days_after_order}} days (set per client, default 90). No 'not in this flow' filter: it would block the newer order's entry.",
  };
}

function sunset(): Def {
  return {
    key: "sunset",
    name: "Sunset",
    purpose: "Last attempt to re-engage subscribers who haven't engaged in 90 days, before they're suppressed.",
    trigger: { type: "segment", source: "{{segments.sunset}}", filters: [] },
    profileFilter: [C.noOpenSinceStart, C.noClickSinceStart],
    reentry: null,
    steps: [
      wait(5, "minutes"),
      email("sunset-1", "We miss you: the brand feels empty without them", "sunset/01-we-miss-you", ["Your {{brand.name}} table feels empty without you"]),
      wait(1, "days"),
      email("sunset-2", "Final goodbye: last chance to stay subscribed", "sunset/02-goodbye", ["Our final hello from {{brand.name}}"]),
    ],
    variables: [
      {
        key: "segments.sunset",
        description:
          "Segment 'Unengaged 90d': can receive email marketing AND on the newsletter list for 90+ days AND, in the last 90 days, zero opens, zero clicks, zero Active on Site and zero Checkout Started",
        example: "FC | Sunset - Unengaged 90d",
      },
    ],
    benchmarks: { "reference revenue per recipient": "$0.21" },
    notes: "As built, nothing suppresses people after email 2; they stay subscribed unless removed by hand.",
  };
}

function replenishment(): Def {
  return {
    key: "replenishment",
    name: "Replenishment",
    purpose: "Remind customers to reorder around when they'd run out.",
    trigger: { type: "metric", source: "Placed Order", filters: [] },
    // Fix vs reference account: people who reordered kept getting reminders.
    profileFilter: [C.noOrderSinceStart],
    reentry: { value: 1, unit: "days" },
    steps: [
      wait(25, "days"),
      email("replenish-1", "Did you run out? Reorder reminder", "replenishment/01-reminder", ["Did your pantry run dry?"]),
      wait(5, "days"),
      email("replenish-2", "Running low: keep the routine on track", "replenishment/02-running-low", ["Running low? Keep your {{copy.winback_ritual}} on track"]),
      wait(10, "days"),
      email("replenish-3", "Stash is running low, let's fix that", "replenishment/03-last-reminder", ["Your stash is running low…let’s fix that"]),
    ],
    variables: [
      { key: "replenishment.first_reminder_days", description: "Days after the order for the first reminder (about when a typical order runs out)", example: "25" },
      { key: "copy.winback_ritual", description: "What the customer's routine with the product is called", example: "superfood ritual" },
    ],
    benchmarks: { "reference revenue per recipient": "$3.35", "reference order rate": "1.1%" },
    notes: "First wait is {{replenishment.first_reminder_days}} days (default 25). Re-entry is daily so each new order restarts the timer; the earlier entry exits on the new order.",
  };
}

function vip(): Def {
  return {
    key: "vip",
    name: "VIP (3rd order)",
    purpose: "Welcome customers into VIP status on their third order and turn them into referrers.",
    trigger: { type: "metric", source: "Placed Order", filters: [] },
    profileFilter: [C.ordersOverAllTime("equals", 3), C.excludeCustomerTags],
    reentry: null,
    steps: [
      wait(5, "minutes"),
      email("vip-1", "Welcome to VIP: a gift from the brand", "vip/01-welcome", ["Our gift to you: welcome to {{brand.name}} VIP"]),
      wait(3, "days"),
      email("vip-2", "VIP perks", "vip/02-perks", ["Your VIP perks begin"]),
      wait(10, "days"),
      email("vip-3", "Founder note to their best customers", "vip/03-founder-note", ["{{copy.vip_founder_subject}}"]),
      wait(7, "days"),
      email("vip-4", "Referral: invite a friend, earn {{offer.referral_reward}}", "vip/04-referral", ["Pass the goodness: invite a friend, earn {{offer.referral_reward}}"]),
    ],
    variables: [
      commonVars.tags,
      { key: "copy.vip_founder_subject", description: "Founder note subject", example: "Jeff’s counting on you" },
      { key: "offer.referral_reward", description: "Referral reward", example: "$10" },
    ],
    benchmarks: { "reference revenue per recipient": "$0.99" },
    notes: "Reference account version is in draft. Its duplicate 'at least 3 orders' condition is dropped (it's implied by 'exactly 3').",
  };
}

function repeatBuyer(): Def {
  return {
    key: "repeat-buyer",
    name: "Repeat Buyer (2nd order)",
    purpose: "Welcome back second-time buyers and push the third order with a time-limited offer.",
    trigger: { type: "metric", source: "Placed Order", filters: [] },
    profileFilter: [C.ordersOverAllTime("greater-than", 1), C.excludeCustomerTags],
    reentry: null,
    steps: [
      wait(5, "minutes"),
      email("repeat-1", "Welcome back: a sneak peek at the perks ahead", "repeat-buyer/01-welcome-back", ["Welcome back, {{ first_name|title|default:'there' }}"], { preview: "Take a sneak peek at the VIP perks ahead." }),
      wait(1, "days"),
      email("repeat-2", "Offer for the next order: {{discount.repeat_value}} off", "repeat-buyer/02-offer", ["Save {{discount.repeat_value}} on your next {{brand.name}} discovery"]),
      wait(10, "days"),
      email("repeat-3", "Offer reminder: 3 days left", "repeat-buyer/03-reminder", ["Three days left to claim"]),
      wait(2, "days"),
      email("repeat-4", "Offer expires tomorrow", "repeat-buyer/04-last-chance", ["Your {{discount.repeat_code}} expires tomorrow"]),
    ],
    variables: [
      commonVars.tags,
      { key: "discount.repeat_code", description: "Repeat-buyer offer code", example: "FAMILY15" },
      { key: "discount.repeat_value", description: "Repeat-buyer offer", example: "15%" },
    ],
    benchmarks: { "reference revenue per recipient": "$1.61", "reference order rate": "0.51%" },
    notes: "Re-entry is once only, so this runs on the 2nd order. The reference account had an A/B test on email 1 (two designs) set up but never started; left out here.",
  };
}

// Small adjustments where a flow starts with a wait before email 1.
function withLeadingWait(d: Def, value: number, unit: Unit): Def {
  return { ...d, steps: [wait(value, unit), ...d.steps] };
}

const defs: Def[] = [
  welcome(),
  withLeadingWait(siteAbandonment(), 2, "hours"),
  withLeadingWait(browseAbandonment(), 2, "hours"),
  withLeadingWait(cartOrCheckout("cart"), 30, "minutes"),
  withLeadingWait(cartOrCheckout("checkout"), 30, "minutes"),
  postPurchase(),
  winback(),
  sunset(),
  replenishment(),
  vip(),
  repeatBuyer(),
];

const CORE = new Set(["welcome", "site-abandonment", "browse-abandonment", "abandoned-cart", "abandoned-checkout", "post-purchase", "winback"]);

const TEMPLATES = "brain/design/fluid-email-designer/templates";

async function main() {
  await mkdir("brain/flows/archive/dolce-klaviyo", { recursive: true });
  const missing = new Map<string, Set<string>>();
  let failed = false;
  for (const d of defs) {
    const { steps, ...rest } = d;
    const { entry, actions } = compile(steps);
    const framework = FlowFrameworkSchema.parse({
      ...rest,
      version: 1,
      status: "draft",
      source: { kind: "klaviyo-import", note: `${CORE.has(d.key) ? "Core" : "Optional"} flow. Built from the Fluid flow in the reference Klaviyo account (2026-10-20), with Fluid-approved fixes noted in notes.` },
      entry,
      actions,
    });
    const real = validateFramework(framework);
    if (real.length) {
      failed = true;
      console.error(`✗ ${d.key}\n  ${real.join("\n  ")}`);
    }
    for (const a of actions)
      if (a.type === "send-email" && !(await access(`${TEMPLATES}/${a.template}.html`).then(() => true, () => false)))
        missing.set(d.key, (missing.get(d.key) ?? new Set()).add(a.template));
    await writeFile(`brain/flows/archive/dolce-klaviyo/${d.key}.json`, JSON.stringify(framework, null, 2) + "\n");
    const n = (t: string) => actions.filter((a) => a.type === t).length;
    console.log(`${real.length ? "✗" : "✓"} ${d.key.padEnd(20)} ${String(actions.length).padStart(3)} steps · ${n("send-email")} emails · ${n("send-sms")} SMS · ${n("conditional-split")} splits`);
  }
  if (missing.size) {
    console.log(`\nNo Fluid design template yet (fluid-email-designer):`);
    for (const [k, t] of missing) console.log(`  ${k.padEnd(20)} ${[...t].join(", ")}`);
  }
  if (failed) process.exit(1);
}

main();
