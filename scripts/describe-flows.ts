// Generates brain/flows/OVERVIEW.md from the framework JSON files: trigger, filters, splits and
// each path as an outline. This is the review copy; the JSON files are the source of truth.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { FlowFrameworkSchema, type FlowAction, type FlowFramework } from "../lib/flows/framework";
import { PopupSchema } from "../lib/flows/popup";

const dur = (v: number, u: string) => `${v} ${v === 1 ? u.replace(/s$/, "") : u}`;
const ORDER = ["welcome", "site-abandonment", "browse-abandonment", "abandoned-cart", "abandoned-checkout", "post-purchase", "winback", "sunset", "replenishment", "vip", "repeat-buyer"];

function outline(f: FlowFramework): string[] {
  const byId = new Map(f.actions.map((a) => [a.id, a]));
  const lines: string[] = [];
  const seen = new Set<string>();
  const label = (a: FlowAction) =>
    a.type === "send-sms" ? `💬 ${a.id}` : a.type === "send-email" ? `📧 ${a.id}` : a.type === "time-delay" ? `wait ${dur(a.delay.value, a.delay.unit)}` : a.type;
  const detourSteps = (from: string | null, join: string): FlowAction[] | null => {
    const steps: FlowAction[] = [];
    for (let id = from; id; ) {
      if (id === join) return steps;
      const a = byId.get(id)!;
      if (!("next" in a) || steps.length > 4) return null;
      steps.push(a);
      id = a.next;
    }
    return null;
  };
  const walk = (id: string | null, depth: number, pending: string | null) => {
    const pad = "  ".repeat(depth);
    while (id) {
      const a: FlowAction = byId.get(id)!;
      if (seen.has(id)) return void lines.push(`${pad}- ↳ rejoins the main path`);
      seen.add(id);
      const pre = pending ? `**${pending}** → ` : "";
      switch (a.type) {
        case "time-delay":
          pending = `wait ${dur(a.delay.value, a.delay.unit)}`;
          id = a.next;
          continue;
        case "send-email":
          lines.push(`${pad}- ${pre}📧 **${a.id}**: “${a.subject[0]}”${a.dynamicBlock ? ` _(dynamic: ${a.dynamicBlock})_` : ""}${a.resendOf ? " _(resend)_" : ""}`);
          id = a.next;
          break;
        case "send-sms":
          lines.push(`${pad}- ${pre}💬 **${a.id}**: ${a.job}`);
          id = a.next;
          break;
        case "update-profile":
          lines.push(`${pad}- ${pre}🏷 set ${a.property} = "${a.value}", then exit`);
          id = a.next;
          break;
        case "conditional-split":
        case "trigger-split":
          // "Detour": the Yes side is a few steps that rejoin the No side (e.g. send the SMS only to
          // SMS subscribers, then everyone continues). Show it inline instead of as two paths.
          const detour = a.next_if_false ? detourSteps(a.next_if_true, a.next_if_false) : null;
          if (detour) {
            lines.push(`${pad}- ${pre}◇ if ${a.condition.description}: ${detour.map(label).join(" → ")}`);
            id = a.next_if_false;
            break;
          }
          if (a.next_if_false === null && a.next_if_true) {
            lines.push(`${pad}- ${pre}✓ only if: ${a.condition.description}`);
            id = a.next_if_true;
            break;
          }
          lines.push(`${pad}- ${pre}◆ **Split:** ${a.condition.description}`);
          lines.push(`${pad}  - **Yes:**`);
          walk(a.next_if_true, depth + 2, null);
          lines.push(`${pad}  - **No:**`);
          if (a.next_if_false) walk(a.next_if_false, depth + 2, null);
          else lines.push(`${pad}    - exit`);
          return;
        default:
          lines.push(`${pad}- ${pre}${a.type}`);
          id = null;
      }
      pending = null;
    }
    if (pending) lines.push(`${pad}- **${pending}** → end`);
  };
  walk(f.entry, 0, null);
  return lines;
}

// The email-by-email brief, in the house format of Fluid's strategy docs.
function briefs(f: FlowFramework): string[] {
  const byId = new Map(f.actions.map((a) => [a.id, a]));
  const prevDelay = new Map<string, string>();
  for (const a of f.actions) if (a.type === "time-delay" && a.next) prevDelay.set(a.next, `${dur(a.delay.value, a.delay.unit)}${a.delay.variable ? ` (\`${a.delay.variable}\`: set from the client's data)` : ""} later`);
  const out: string[] = [];
  for (const a of f.actions) {
    if (a.type === "send-sms" && !a.sameAs) out.push(`#### SMS: ${a.job}`, "", `- **Send Time:** ${prevDelay.get(a.id) ?? "Immediately after the previous email"}`, `- **Draft:** ${a.body}`, "");
    if (a.type !== "send-email" || a.sameAs) continue;
    out.push(`#### ${a.name ?? a.id}`, "");
    out.push(`- **Send Time:** ${prevDelay.get(a.id) ?? (a.id === byId.get(f.entry)?.id || f.entry.startsWith("split") ? "Immediately" : "Immediately")}`);
    if (a.topic) out.push(`- **Email Topic:** ${a.topic}`);
    out.push(`- **Design:** ${a.format === "plain_text" ? "Plain text" : "Yes"}  ·  template \`${a.template}\`${a.dynamicBlock ? `  ·  dynamic: ${a.dynamicBlock}` : ""}`);
    if (a.sendingTo) out.push(`- **Sending to:** ${a.sendingTo}`);
    if (a.offer) out.push(`- **Offer:** ${a.offer}`);
    if (a.structure) out.push(`- **Structure:** ${a.structure}`);
    const g = a.goals;
    if (g) {
      out.push("- **Goals:**");
      for (const x of g.all) out.push(`  - ${x}`);
      if (g.replenishable.length) out.push("  - _Replenishable:_", ...g.replenishable.map((x) => `    - ${x}`));
      if (g.one_off.length) out.push("  - _One-off:_", ...g.one_off.map((x) => `    - ${x}`));
    }
    out.push("");
  }
  return out;
}

async function main() {
  const files = (await readdir("brain/flows")).filter((f) => f.endsWith(".json") && !["popup.json", "system.json"].includes(f));
  const flows = await Promise.all(files.map(async (f) => FlowFrameworkSchema.parse(JSON.parse(await readFile(`brain/flows/${f}`, "utf8")))));
  flows.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const popup = PopupSchema.parse(JSON.parse(await readFile("brain/flows/popup.json", "utf8")));
  const system = JSON.parse(await readFile("brain/flows/system.json", "utf8"));
  const out = [
    "# Fluid's flow system",
    "",
    "_Generated by `scripts/describe-flows.ts` from `brain/flows/*.json` (built by `npm run brain:flows`). Edit the generator, not this file._",
    "",
    `Source: ${system.source}. One structure, two versions: **replenishable** (${system.versions.replenishable}) and **one-off** (${system.versions.one_off}). Same flows, email counts and timings; only the goals differ.`,
    "",
    `**Core:** pop-up + ${flows.filter((f) => f.tier !== "optional").map((f) => f.name).join(", ")}.  `,
    `**Optional (propose with the number that justifies it):** ${flows.filter((f) => f.tier === "optional").map((f) => f.name).join(", ")}.`,
    "",
    `## ${popup.name}`,
    "",
    popup.purpose,
    "",
    `- **Target:** ${popup.target}`,
    `- **Answer stored as:** \`${popup.profileProperty}\` → ${popup.routesTo}`,
    "",
  ];
  for (const st of popup.steps) {
    out.push(`#### Step #${st.step}: ${st.name}`, "", `- **Headline:** ${st.headline}`);
    if (st.subheadline) out.push(`- **Sub:** ${st.subheadline}`);
    if (st.fields?.length) out.push(`- **Fields / answers:** ${st.fields.join(" · ")}`);
    if (st.button) out.push(`- **Button:** ${st.button}`);
    if (st.secondary) out.push(`- **Secondary:** ${st.secondary}`);
    if (st.consent) out.push(`- **Consent:** ${st.consent}`);
    for (const g of st.goals) out.push(`- ${g}`);
    out.push("");
  }
  out.push("**Question styles that worked**", "", "| Version | Style | Example |", "|---|---|---|");
  for (const v of ["replenishable", "one_off"] as const) for (const q of popup.questionStyles[v]) out.push(`| ${v === "one_off" ? "One-off" : "Replenishable"} | ${q.style} | ${q.example} |`);
  out.push("", `**Offer options:** ${popup.offerOptions.join("; ")}.`, "", `**Strategy note under the pop-up:** ${popup.strategyNote.join("; ")}.`, "");
  for (const f of flows) {
    const splits = [...new Set(f.actions.flatMap((a) => ("condition" in a ? [a.condition.description] : [])))];
    out.push(
      `## ${f.name}${f.tier === "optional" ? " _(optional)_" : ""}`,
      "",
      f.purpose,
      "",
      `- **Trigger:** ${f.trigger.type === "metric" ? "Metric" : f.trigger.type === "list" ? "Added to list" : "Added to segment"}: ${f.trigger.source}`,
      `- **Filter:** ${f.profileFilter.map((c) => c.description).join(" AND ") || "none"}`,
      `- **Re-entry:** ${f.reentry ? `after ${dur(f.reentry.value, f.reentry.unit)}` : "once only"}`,
      `- **Splits used:** ${splits.length ? splits.join(" · ") : "none"}`,
      ...(f.notes ? [`- **Notes:** ${f.notes}`] : []),
      "",
      "<details><summary>Flow map</summary>",
      "",
      ...outline(f),
      "",
      "</details>",
      "",
      ...briefs(f),
    );
  }
  out.push("## Offer ladder", "", "Anchored on the client's welcome offer (W).", "", "| Where | Default |", "|---|---|");
  for (const r of system.offerLadder) out.push(`| ${r.where} | ${r.default} |`);
  out.push("", ...system.offerRules.map((r: string) => `- ${r}`), "", "## Flow rules", "", ...system.flowRules.map((r: string) => `- ${r}`), "");
  await writeFile("brain/flows/OVERVIEW.md", out.join("\n"));
  console.log(`Wrote brain/flows/OVERVIEW.md (pop-up + ${flows.length} flows)`);
}

main();
