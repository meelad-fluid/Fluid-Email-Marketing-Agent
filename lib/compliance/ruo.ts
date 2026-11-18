// Automatic wording check for research-use-only (RUO) peptide clients, from Fluid's RUO SOP
// (knowledge/sops/ruo-peptide-compliance-sop.md). It catches the plain violations (human benefits, medical
// claims, administration, personal results, unverified quality claims, effect-based category framing) so
// a design can't be published or pushed with them. It is a floor, not the review: implied claims still
// need the copywriter's compliance gate and a person at Fluid.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RULES: [string, RegExp][] = [
  ["weight / body composition (SOP 4.1)", /\b(weight[- ]?loss|los(e|ing) weight|fat[- ]?(loss|burn\w*)|burn(s|ing)? fat|appetite|calories?|thermogen\w*|lean (muscle|mass)|body (composition|recomp\w*)|blood sugar|glucose|insulin|obesity|shred\w*)\b/i],
  ["muscle / performance / recovery (SOP 4.2)", /\b(muscles?|strength|endurance|recover(y|ing|ies)?|heal(s|ing|ed)?|injur(y|ies|ed)|performance|testosterone|hormones?|gains|pumps?|athlet\w*|workouts?|gym)\b/i],
  ["anti-aging / beauty / longevity (SOP 4.3)", /\b(anti-?aging|longevity|lifespan|younger|youthful|wrinkles?|skin|hair|collagen|rejuvenat\w*|vitality|sleep)\b/i],
  ["medical / disease (SOP 4.4)", /\b(inflamm\w*|diabet\w*|obes\w*|pain|immun(e|ity)|anxiety|depress\w*|libido|erectile|sexual|neurolog\w*|diseases?|symptoms?|treat(s|ment|ing|ed)?|cur(e|es|ed|ing)|therap\w*|patients?|prescriptions?|GLP-1 (drug|medication))\b/i],
  ["administration / use (SOP 4.5)", /\b(dos(e|es|age|ing)|inject\w*|syringes?|needles?|subq|subcutaneous|intramuscular|reconstitut\w*|bacteriostatic|bac water|cycles?|stack(s|ed|ing)?|protocols?|regimens?|administer\w*|per day|daily use)\b/i],
  ["personal results / transformation (SOP 4.6, 5)", /\b(transform\w*|journey|your body|(?<!(test|testing|analytical|lab|laboratory|assay) )results?|before[- ](and[- ])?after|feel (better|younger|great|amazing)|better version|wellness|well-being|health(y|ier)?)\b/i],
  ["unverified quality claim (SOP 6.3, 11)", /\b(pharmaceutical[- ]grade|medical[- ]grade|FDA[- ]?(approved|registered|compliant|inspected|certified|cleared)|100% pure|sterile|clinically (proven|tested|studied)|hospital[- ]quality|safer than)\b/i],
  ["effect-based category framing (SOP 5)", /\b(metabolic|recovery|longevity|anti-?aging|healing|performance|weight|fat[- ]loss|GH|growth hormone|cognitive|nootropic)\s+(research|compounds?|peptides?|stacks?|line(up)?|categor(y|ies)|collection|bundle)\b/i],
  ["use-implying winback (SOP 9)", /\b(next cycle|running low|keep your progress|don'?t lose|another round)\b/i],
];
const DISCLAIMER = /research use only|not for human|veterinary|food and drug administration|not intended to diagnose/i;

export type RuoHit = { rule: string; phrase: string; text: string };

/** True when the client is marked research-use-only (compliance.md in their folder). */
export function isRuoClient(clientDir: string): boolean {
  const f = join(clientDir, "compliance.md");
  return existsSync(f) && /research[- ]use[- ]only|\bRUO\b/i.test(readFileSync(f, "utf8"));
}

/** Words the client is allowed to use anyway (e.g. their brand name), from "Allowed terms:" in compliance.md. */
function allowed(clientDir: string): string[] {
  const f = join(clientDir, "compliance.md");
  const m = existsSync(f) ? readFileSync(f, "utf8").match(/^Allowed terms:\s*(.+)$/im) : null;
  return m ? m[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
}

export function scanRuoText(text: string, clientDir: string): RuoHit[] {
  let t = text;
  for (const a of allowed(clientDir)) t = t.replace(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  const hits: RuoHit[] = [];
  for (const sentence of t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean)) {
    if (DISCLAIMER.test(sentence)) continue;
    for (const [rule, re] of RULES) { const m = sentence.match(re); if (m) hits.push({ rule, phrase: m[0], text: sentence.slice(0, 160) }); }
  }
  return hits;
}

/** Visible text, alt text and image file names of an email's HTML. */
export function emailText(html: string): string {
  const alts = [...html.matchAll(/\balt="([^"]*)"/gi)].map((m) => m[1]);
  const files = [...html.matchAll(/\bsrc="[^"]*?([^/"]+)\.(png|jpe?g|webp|gif|svg)"/gi)].map((m) => m[1].replace(/[-_]+/g, " "));
  const body = html.replace(/<(style|script|helmet)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h\d|li|a|span|td)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'");
  return [body, ...alts, ...files].join("\n");
}

export const ruoSummary = (h: RuoHit[]) => h.map((x) => `- "${x.phrase}" (${x.rule}) in: ${x.text}`).join("\n");

// Image prompts for RUO clients: no people, bodies or use.
const IMAGE_RULE = /\b(person|people|man|woman|men|women|girl|guy|athlete|bodybuilder|body|muscle|abs|face|skin|hand|hands|injection|inject\w*|syringe|needle|scale|gym|workout|before|after|mirror|patient|doctor|nurse|clinic|bedroom|couple)\b/i;
export function ruoImagePromptProblem(prompt: string): string | null {
  const m = prompt.match(IMAGE_RULE);
  return m ? `RUO client: images can't show people, bodies, use or treatment ("${m[0]}"). Use real packaging, vials, COAs, lab equipment or lab settings (SOP §12).` : null;
}
