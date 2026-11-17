// The client onboarding questionnaire: the single source for the onboarding form, what's stored
// in profile_answers (keyed by these ids), and what the agent reads about a brand.
//
// Question ids are permanent. Reword a label freely; never rename or reuse an id, because stored
// answers are keyed by it. `usedFor` records which part of the bot relies on the answer.
// Questions marked `fluid: true` are Fluid's existing onboarding questions, word for word.

export type FieldType = "text" | "textarea" | "url" | "email" | "percent" | "number" | "list" | "choice" | "files" | "connection";

export type Question = {
  id: string;
  label: string;
  help?: string;
  type: FieldType;
  required?: boolean;
  fluid?: boolean; // one of Fluid's original questions
  placeholder?: string;
  options?: string[]; // for "choice"
  max?: number; // for "list": how many entries
  assetKind?: "logo" | "product" | "lifestyle" | "icon" | "past_email" | "reference" | "other"; // for "files"
  provider?: "klaviyo" | "shopify"; // for "connection"
  usedFor: ("strategy" | "copy" | "design" | "implementation" | "reporting" | "compliance")[];
};

export type Section = { id: string; title: string; intro: string; questions: Question[] };

export const QUESTIONNAIRE_VERSION = 1;

export const SECTIONS: Section[] = [
  {
    id: "brand",
    title: "Your brand",
    intro: "The basics we'll build everything on.",
    questions: [
      { id: "brand_name", label: "Brand name", type: "text", required: true, usedFor: ["copy", "design"] },
      { id: "brand_url", label: "What is your brand url?", type: "url", required: true, fluid: true, placeholder: "https://", usedFor: ["design", "strategy"] },
      { id: "client_email", label: "Client Email", help: "The main contact for this project.", type: "email", required: true, fluid: true, usedFor: ["implementation"] },
      { id: "brand_description", label: "Describe your brand in 2 sentences", type: "textarea", required: true, fluid: true, usedFor: ["copy", "strategy"] },
      { id: "unique", label: "What about your service/product is unique?", type: "textarea", required: true, fluid: true, usedFor: ["copy", "strategy"] },
      { id: "founder_story", label: "Who founded the brand, and why?", help: "Used for the founder note in the welcome flow and the post-purchase thank-you. A few sentences is plenty.", type: "textarea", usedFor: ["copy"] },
      { id: "sender_name", label: "Who should emails come from?", help: "The name subscribers see, e.g. \"Jeff from Dolce\" or \"The Battle Sports Team\".", type: "text", required: true, usedFor: ["copy", "implementation"] },
      { id: "business_address", label: "Business mailing address", help: "Required by law in every marketing email footer.", type: "textarea", required: true, usedFor: ["compliance", "design"] },
    ],
  },
  {
    id: "customer",
    title: "Your customer",
    intro: "Who we're writing to, and what they need to hear.",
    questions: [
      { id: "who_writing_to", label: "Who are we writing to?", help: "Describe the person reading these emails: age, situation, what they care about.", type: "textarea", required: true, usedFor: ["copy", "strategy"] },
      { id: "ideal_customer", label: "What does your ideal customer look like?", type: "textarea", required: true, fluid: true, usedFor: ["copy", "strategy"] },
      { id: "pain_points", label: "What struggles/challenges/pain-points your customer has which can be solved by your product?", type: "textarea", required: true, fluid: true, usedFor: ["copy", "strategy"] },
      { id: "purchase_reasons", label: "What are the top 3 reasons people buy from you?", help: "These become the options in your sign-up pop-up, and each one gets its own welcome email.", type: "list", max: 3, required: true, usedFor: ["strategy", "copy"] },
      { id: "objections", label: "What stops people from buying?", help: "Price, sizing, trust, shipping time... The abandonment emails answer these.", type: "textarea", usedFor: ["copy", "design"] },
    ],
  },
  {
    id: "products",
    title: "Products and offers",
    intro: "What we push, and the limits we work within.",
    questions: [
      { id: "best_products", label: "What are your BEST performing products?", help: "Name and link for each, best first.", type: "list", max: 5, required: true, fluid: true, usedFor: ["strategy", "design"] },
      { id: "max_discount", label: "What % is the highest amount we can give away?", type: "percent", required: true, fluid: true, usedFor: ["strategy", "copy"] },
      { id: "welcome_offer", label: "What's your current welcome offer?", help: "e.g. 15% off the first order with WELCOME15. Leave blank if you don't have one yet.", type: "text", usedFor: ["strategy", "copy"] },
      { id: "discount_exclusions", label: "Anything that can never be discounted?", help: "Products, collections or customer groups (e.g. wholesale).", type: "textarea", usedFor: ["strategy", "copy", "compliance"] },
      { id: "reorder_days", label: "How many days until a typical customer needs to reorder?", help: "Sets the timing of the replenishment and win-back emails. A best guess is fine.", type: "number", usedFor: ["strategy"] },
      { id: "shipping_policy", label: "Shipping times and free-shipping threshold", help: "e.g. \"Ships in 2-3 business days. Free shipping over $50.\"", type: "textarea", usedFor: ["copy"] },
      { id: "returns_policy", label: "Returns, exchanges and guarantee", help: "Shown in plain words in the checkout reminder emails.", type: "textarea", usedFor: ["copy"] },
      { id: "upcoming_launches", label: "Launches, sales or big dates coming up", type: "textarea", usedFor: ["strategy"] },
    ],
  },
  {
    id: "voice",
    title: "Voice and rules",
    intro: "How you sound, and what we must never say.",
    questions: [
      { id: "tone_of_voice", label: "What is the Tone of Voice for your brand?", type: "textarea", required: true, fluid: true, usedFor: ["copy"] },
      { id: "words_love", label: "Words or phrases you love", type: "textarea", usedFor: ["copy"] },
      { id: "words_avoid", label: "Words, claims or topics to never use", type: "textarea", usedFor: ["copy", "compliance"] },
      { id: "required_disclaimers", label: "Legal or compliance text that must appear", help: "e.g. an FDA disclaimer, age restrictions, \"for research use only\".", type: "textarea", usedFor: ["compliance", "design"] },
    ],
  },
  {
    id: "market",
    title: "Competitors and inspiration",
    intro: "Who you're up against, and the look you're after.",
    questions: [
      { id: "competitors", label: "List Your Top 5 Competitors", type: "list", max: 5, required: true, fluid: true, usedFor: ["strategy", "copy"] },
      { id: "design_inspiration", label: "Brands for design inspiration", type: "list", max: 5, fluid: true, usedFor: ["design"] },
      { id: "sticking_points", label: "What might get in the way of our success? Where are your usual sticking points?", type: "textarea", required: true, fluid: true, usedFor: ["strategy"] },
      { id: "reviews_url", label: "If you have it, could you link us to a page with your reviews?", type: "url", fluid: true, usedFor: ["copy", "design"] },
    ],
  },
  {
    id: "assets",
    title: "Brand assets",
    intro: "Upload what you have, or share a folder. Product photos on a transparent background make the biggest difference.",
    questions: [
      { id: "assets_folder_url", label: "Share any Brand Assets folder you could share with us?", help: "Google Drive, Dropbox, etc. Make sure anyone with the link can view.", type: "url", fluid: true, usedFor: ["design"] },
      { id: "logo_files", label: "Logo", help: "Ideally a light and a dark version (PNG or SVG).", type: "files", assetKind: "logo", usedFor: ["design"] },
      { id: "product_files", label: "Product photos", help: "Transparent-background PNGs (cutouts) if you have them.", type: "files", assetKind: "product", usedFor: ["design"] },
      { id: "lifestyle_files", label: "Lifestyle photos", help: "Your product in use, people, places.", type: "files", assetKind: "lifestyle", usedFor: ["design"] },
      { id: "brand_guide_files", label: "Brand guide and font files", help: "PDF guide, and font files if your fonts aren't on Google Fonts.", type: "files", assetKind: "other", usedFor: ["design"] },
      { id: "social_links", label: "Social media links", type: "list", max: 6, usedFor: ["design"] },
    ],
  },
  {
    id: "connections",
    title: "Connections",
    intro: "So we can read your data and build in your account. Nothing is ever sent to your customers without your approval.",
    questions: [
      { id: "klaviyo", label: "Klaviyo", type: "connection", provider: "klaviyo", required: true, usedFor: ["implementation", "reporting", "strategy"] },
      { id: "shopify", label: "Shopify", type: "connection", provider: "shopify", required: true, usedFor: ["reporting", "strategy", "design"] },
      { id: "connection_help", label: "Would you like help connecting?", help: "We can do it together on a quick call instead.", type: "choice", options: ["I'm all set", "Help me connect Klaviyo", "Help me connect Shopify", "Help me connect both"], usedFor: ["implementation"] },
      { id: "reviews_platform", label: "Which reviews app do you use?", type: "choice", options: ["Okendo", "Judge.me", "Yotpo", "Stamped", "Loox", "Klaviyo Reviews", "Other", "None"], usedFor: ["design", "implementation"] },
      { id: "sms_platform", label: "Which SMS tool do you use?", type: "choice", options: ["Klaviyo SMS", "Attentive", "Postscript", "Other", "None"], usedFor: ["implementation"] },
    ],
  },
  {
    id: "approvals",
    title: "Approvals and reporting",
    intro: "Who signs off, and where the weekly report goes.",
    questions: [
      { id: "approvers", label: "Who approves emails before they go out?", help: "Name and email for each person.", type: "list", max: 4, required: true, usedFor: ["implementation"] },
      { id: "report_recipients", label: "Who should get the weekly report?", help: "Emails, one per line.", type: "list", max: 6, usedFor: ["reporting"] },
      { id: "timezone", label: "Your timezone", type: "choice", options: ["Eastern (ET)", "Central (CT)", "Mountain (MT)", "Pacific (PT)", "Other"], required: true, usedFor: ["strategy", "reporting"] },
    ],
  },
];

export const QUESTIONS: Question[] = SECTIONS.flatMap((s) => s.questions);
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export type AnswerValue = string | string[] | number | null;

export function isAnswered(q: Question, value: AnswerValue | undefined, ctx: { assetCount?: number; connected?: boolean }): boolean {
  if (q.type === "files") return (ctx.assetCount ?? 0) > 0;
  if (q.type === "connection") return !!ctx.connected;
  if (value == null) return false;
  if (Array.isArray(value)) return value.some((v) => v.trim() !== "");
  return String(value).trim() !== "";
}
