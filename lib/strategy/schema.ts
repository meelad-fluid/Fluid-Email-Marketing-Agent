import { z } from "zod";

// What the strategist agent returns: the structure of the skill's Step 5 presentation
// (evidence → angles → calendar), as data the app can save, show and act on.

export const CAMPAIGN_TYPES = [
  "single_benefit_focus",
  "trending_best_sellers",
  "reviews_testimonials",
  "how_its_made",
  "product_guide",
  "back_in_stock",
  "new_product_drop",
  "holiday",
  "growth_update",
  "sale_promo",
  "founder_note",
] as const;

export const SendSchema = z.object({
  name: z.string().describe("The email's name: 2-6 words saying what it's about, the way the team would refer to it, e.g. 'Why it costs less', 'How to check your superfoods', 'Black Friday last call'. Not the angle name"),
  date: z.string().describe("YYYY-MM-DD, inside the plan window"),
  time: z.string().describe("HH:MM in the client's timezone"),
  channel: z.enum(["email", "sms"]),
  angle: z.string().describe("Exactly one of the angle names above"),
  campaign_type: z.enum(CAMPAIGN_TYPES),
  topic: z.string().describe("The overarching message of the email: the specific argument it makes, in one or two sentences"),
  segment: z.string().describe("The segment to send to, named as the client would have it in Klaviyo"),
  audience: z.enum(["engaged", "non_buyers", "lapsed", "vip", "other"]),
  format: z.enum(["designed", "plain_text", "sms"]),
  goal: z.string().describe("Two or three short sentences: what the reader should understand or feel, the one action, and the format. No figures or past-send references"),
  offer: z.string().nullable().describe("Code, amount, deadline and exclusions, or null"),
  why: z.string().describe("Why this send is on the calendar, citing the figure or playbook rule"),
  test: z.string().nullable().describe("The one variable to test on this send, or null"),
});

export type PlannedSendDraft = z.infer<typeof SendSchema>;

export const PlanResultSchema = z.object({
  headline: z.string().describe("The one-sentence thesis of the month, as you'd say it to the account manager"),
  evidence: z
    .array(z.object({ finding: z.string().describe("A short title, e.g. 'Top by RPR'"), detail: z.string().describe("The finding with its figures") }))
    .describe("3-5 findings from the last 90 days, each with a number"),
  patterns: z
    .array(
      z.object({
        winner: z.string().describe("The top send, by date and subject, with its revenue and RPR"),
        angle: z.string().describe("The angle it ran on"),
        messaging: z.string().describe("The argument it made and the words or hook that carried it"),
        content: z.string().describe("What the email looked like: length, designed or plain text, images, offer or not, the CTA"),
        lead_in: z.string().describe("The 1-3 sends before it (same audience, about 14 days) and what they set up"),
        pattern: z.string().nullable().describe("The repeatable sequence this suggests, e.g. 'two education sends, then the cost argument', or null if it stands alone"),
      }),
    )
    .describe("The 3-5 top sends of the last 90 days traced back: what they said, how they looked, and what came before them"),
  audit: z.array(z.string()).describe("Structural findings from the playbook's audit checklist that outrank any single slot (empty if none)"),
  angles: z
    .array(
      z.object({
        name: z.string().describe("A name the team would say out loud"),
        purpose: z.enum(["acquisition", "retention", "reactivation"]),
        audience: z.enum(["engaged", "non_buyers", "lapsed", "vip", "mixed"]),
        slots: z.number().int(),
        justification: z.string().describe("The figure or playbook gap that earned this angle its slots"),
        is_bet: z.boolean().describe("True when the angle is unproven for this client"),
      }),
    )
    .describe("The month's 3-5 angles"),
  sends: z.array(SendSchema).describe("Every send in date order"),
  mix: z.object({
    audience: z.string().describe("Engaged / lapsed / non-buyer split vs the ~80/20 target, and whether any miss is deliberate"),
    value_vs_promo: z.string().describe("Value vs promo split vs 80/20, and whether any miss is deliberate"),
  }),
  open_questions: z.array(z.string()).describe("Only what the team actually needs to answer (a code, stock, a date)"),
});

export type PlanResult = z.infer<typeof PlanResultSchema>;
