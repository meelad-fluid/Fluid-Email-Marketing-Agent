// Mirrors Fluid's fluid-email-designer skill into brain/design/fluid-email-designer/ so the agent's
// design brain uses the exact rules, flow blueprints, HTML templates and example sheets Fluid
// maintains in that skill. The skill stays the place Fluid edits; re-run this to pick up changes.
// Usage: npm run brain:design [-- <path to skill folder>] [--force]

import { cp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const DEST = "brain/design/fluid-email-designer";

async function findSkill(): Promise<{ dir: string; updatedAt?: string }> {
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (arg) return { dir: arg };
  const root = join(homedir(), ".claude/skills/synced");
  for (const account of await readdir(root)) {
    const dir = join(root, account, "fluid-email-designer");
    if (await stat(dir).then(() => true, () => false)) {
      const manifest = JSON.parse(await readFile(join(root, account, "manifest.json"), "utf8").catch(() => "{}"));
      const entry = manifest.skills?.find((s: { name: string }) => s.name === "fluid-email-designer");
      return { dir, updatedAt: entry?.updatedAt };
    }
  }
  throw new Error("fluid-email-designer skill not found under ~/.claude/skills/synced; pass its path");
}

async function files(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p, base)));
    else out.push(p.slice(base.length + 1));
  }
  return out.sort();
}

async function main() {
  const { dir, updatedAt } = await findSkill();
  // Flows can be added here first (then uploaded to claude.ai). Never wipe additions the skill doesn't have yet.
  const exists = await stat(DEST).then(() => true, () => false);
  if (exists && !process.argv.includes("--force")) {
    const inSkill = new Set(await files(dir));
    const extra = (await files(DEST)).filter((f) => !inSkill.has(f));
    if (extra.length) {
      console.error(`brain/design has ${extra.length} files the installed skill doesn't (e.g. ${extra.slice(0, 3).join(", ")}).`);
      console.error("Upload out/fluid-email-designer.zip to claude.ai first, or re-run with --force to discard them.");
      process.exit(1);
    }
  }
  await rm(DEST, { recursive: true, force: true });
  await cp(dir, DEST, { recursive: true });
  const list = await files(DEST);
  await writeFile(
    "brain/design/SOURCE.md",
    `# Source of brain/design/fluid-email-designer\n\nExact mirror of Fluid's \`fluid-email-designer\` skill. Don't edit the mirror; edit the skill and re-run \`npm run brain:design\`.\n\n- Imported: ${new Date().toISOString().slice(0, 10)}\n- Skill last updated: ${updatedAt ?? "unknown"}\n- Files: ${list.length}\n\n${list.map((f) => `- \`${f}\``).join("\n")}\n`,
  );
  console.log(`Mirrored ${list.length} files from ${dir} (skill updated ${updatedAt ?? "unknown"})`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
