import { z } from "zod";

// Fluid's 4-step opt-in pop-up: the front door of the whole flow system. Step 1's answer is saved
// to a profile property and routes the subscriber to one of the three versions of Welcome Email #1.
const Step = z.object({
  step: z.number().int(),
  name: z.string(), // "Teaser + Collect Zero Party Data"
  headline: z.string(),
  subheadline: z.string().optional(),
  fields: z.array(z.string()).optional(), // "Email", "Phone number", or the 3 answer buttons
  button: z.string().optional(),
  secondary: z.string().optional(), // skip link / secondary link
  consent: z.string().optional(),
  goals: z.array(z.string()).default([]),
});

export const PopupSchema = z.object({
  key: z.literal("popup"),
  name: z.string(),
  version: z.number().int().positive(),
  purpose: z.string(),
  target: z.string(), // "10%+ submit rate"
  profileProperty: z.string(), // where the step-1 answer is stored
  routesTo: z.string(), // the welcome split it feeds
  steps: z.array(Step).length(4),
  // Question styles that worked in Fluid's strategies, by version, with an example from a real client.
  questionStyles: z.object({
    replenishable: z.array(z.object({ style: z.string(), example: z.string() })),
    one_off: z.array(z.object({ style: z.string(), example: z.string() })),
  }),
  offerOptions: z.array(z.string()),
  strategyNote: z.array(z.string()), // the "Strategy" bullets each client doc writes under the pop-up
  variables: z.array(z.object({ key: z.string(), description: z.string(), example: z.string().optional() })),
});

export type Popup = z.infer<typeof PopupSchema>;
