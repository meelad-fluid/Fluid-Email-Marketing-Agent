import { z } from "zod";

// The email spec: what the AI writes (skills/design/layout-composition).
// It never contains pixels or brand styling, only structure, copy and asset references.

const bg = z.enum(["background", "surface", "primary", "secondary"]);

// How a section flows into the next one [SOP: continuous flow, no blocky seams].
const edge = z.enum(["wave", "curve", "fade", "straight"]).default("wave");

const cta = z.object({ label: z.string(), url: z.string() });

const asset = z.object({
  src: z.string().nullable(), // null = asset missing; renders a placeholder and QA flags it
  description: z.string(), // what the shot should show; also used for alt text
});

const base = {
  id: z.string(),
  bg: bg.default("background"),
  edge,
  alt: z.string().optional(), // slice alt text; generated from the copy if missing
  link: z.string().optional(), // where the slice links; defaults to the section CTA
};

export const SectionSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("hero"),
    announcement: z.string().optional(),
    headline: z.string(),
    highlight: z.string().optional(), // one word/number in the headline to color with the accent
    subheadline: z.string().optional(),
    offer: z.object({ code: z.string().optional(), deadline: z.string().optional() }).optional(),
    cta,
    image: asset.optional(),
  }),
  z.object({
    ...base,
    type: z.literal("icon-row"),
    title: z.string().optional(),
    items: z.array(z.object({ icon: z.string(), label: z.string(), detail: z.string().optional() })).min(2).max(3),
    cta,
  }),
  z.object({
    ...base,
    type: z.literal("text-block"),
    title: z.string().optional(),
    paragraphs: z.array(z.string()).min(1).max(4),
    cta,
  }),
  z.object({
    ...base,
    type: z.literal("product-grid"),
    title: z.string().optional(),
    products: z.array(z.object({ name: z.string(), blurb: z.string(), price: z.string().optional(), image: asset, cta })).min(1).max(3),
    cta: cta.optional(), // per-product buttons count as the section CTA
  }),
  z.object({
    ...base,
    type: z.literal("reviews"),
    title: z.string().optional(),
    reviews: z.array(z.object({ quote: z.string(), name: z.string(), stars: z.number().min(1).max(5).default(5) })).min(1).max(3),
    cta,
  }),
  z.object({
    ...base,
    type: z.literal("comparison"),
    title: z.string(),
    us: z.string(),
    them: z.string(),
    rows: z.array(z.object({ label: z.string(), us: z.boolean(), them: z.boolean() })).min(3).max(5),
    cta,
  }),
  z.object({
    ...base,
    type: z.literal("steps"),
    title: z.string(),
    steps: z.array(z.object({ title: z.string(), detail: z.string() })).length(3),
    cta,
  }),
  z.object({
    ...base,
    type: z.literal("offer-recap"),
    headline: z.string(),
    code: z.string().optional(),
    deadline: z.string().optional(),
    cta,
  }),
  z.object({ ...base, type: z.literal("footer") }),
]);

export const EmailSpecSchema = z.object({
  campaignType: z.enum(["sale", "launch", "educational", "welcome", "social-proof", "winback", "seasonal", "brand"]),
  subject: z.string(),
  preview: z.string(),
  sections: z.array(SectionSchema).min(2),
});

export type EmailSpec = z.infer<typeof EmailSpecSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type SectionOf<T extends Section["type"]> = Extract<Section, { type: T }>;
