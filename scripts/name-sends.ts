// Gives planned sends that have no short name one (plans written before sends had names).
// Usage: npx tsx scripts/name-sends.ts [plan-id]
import { readFileSync } from "node:fs";
import { z } from "zod";

for (const [, k, v] of readFileSync(".env.local", "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();

const Names = z.object({ names: z.array(z.object({ id: z.string(), name: z.string() })) });

async function main() {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { betaZodOutputFormat } = await import("@anthropic-ai/sdk/helpers/beta/zod");
  const { supabaseAdmin } = await import("../lib/supabase/admin");
  const { PLAN_MODEL } = await import("../lib/strategy/plan");
  const db = supabaseAdmin();
  let q = db.from("plan_sends").select("id, channel, angle, topic").is("name", null);
  if (process.argv[2]) q = q.eq("plan_id", process.argv[2]);
  const { data: sends } = await q;
  if (!sends?.length) return console.log("Every send already has a name.");

  const message = await new Anthropic().beta.messages.create({
    model: PLAN_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(Names) },
    messages: [{
      role: "user",
      content: `Give each planned email/SMS a short name: 2-6 words saying what it's about, the way an email team would refer to it in a calendar. Examples: "Why it costs less", "How to check your superfoods", "Black Friday last call". Not the angle name, and not the whole argument. Sentence case.\n\n${JSON.stringify(sends)}`,
    }],
  });
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const { names } = Names.parse(JSON.parse(text));
  for (const n of names) {
    if (!sends.some((s) => s.id === n.id)) continue;
    await db.from("plan_sends").update({ name: n.name }).eq("id", n.id);
    console.log(`${n.name}  ←  ${sends.find((s) => s.id === n.id)!.topic.slice(0, 80)}…`);
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
