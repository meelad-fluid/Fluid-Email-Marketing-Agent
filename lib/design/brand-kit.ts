import { z } from "zod";

// The client's visual system. Every email renders from this, so the same spec
// looks like a different brand when rendered with a different kit.
// See skills/design/brand-kit-extraction/SKILL.md.

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const BrandKitSchema = z.object({
  name: z.string(),
  status: z.enum(["draft", "confirmed"]).default("draft"),
  colors: z.object({
    primary: hex,
    secondary: hex,
    background: hex,
    surface: hex,
    text: hex,
    textMuted: hex,
    // Reserved for buttons and the key offer number (playbook §3.2).
    accent: hex,
    onAccent: hex,
    onPrimary: hex,
  }),
  fonts: z.object({
    display: z.object({ family: z.string(), weight: z.number().default(800), googleFont: z.boolean().default(true), transform: z.enum(["none", "uppercase"]).default("none") }),
    body: z.object({ family: z.string(), weight: z.number().default(400), googleFont: z.boolean().default(true) }),
  }),
  logo: z.object({
    // Image URL/path, or null to render the wordmark text in the display font.
    src: z.string().nullable(),
    wordmark: z.string(),
  }),
  button: z.object({
    shape: z.enum(["pill", "rounded", "square"]),
    // [SOP] buttons need a border + drop shadow for a 3D look.
    borderColor: hex,
    shadowColor: hex,
  }),
  photoStyle: z.string().default(""),
  footer: z.object({
    address: z.string(),
    socials: z.array(z.enum(["instagram", "tiktok", "facebook", "youtube", "x", "pinterest"])).default([]),
    trustBadges: z.array(z.string()).max(3).default([]),
    compliance: z.string().optional(),
  }),
});

export type BrandKit = z.infer<typeof BrandKitSchema>;
