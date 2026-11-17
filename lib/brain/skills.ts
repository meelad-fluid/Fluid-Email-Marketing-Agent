import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Loads a brain skill's instructions and references from the repo, so the agent runs on exactly
// what's in brain/ (edit the skill, and the next run uses it). Files are listed explicitly so the
// deployment bundles them (see outputFileTracingIncludes in next.config.mjs).

const ROOT = join(process.cwd(), "brain");

export const SKILL_FILES = {
  strategist: [
    "skills/fluid-email-strategist/SKILL.md",
    "skills/fluid-email-strategist/references/playbook.md",
    "skills/fluid-email-strategist/references/brief.md",
  ],
} as const;

export async function loadSkill(name: keyof typeof SKILL_FILES): Promise<string> {
  const parts = await Promise.all(
    SKILL_FILES[name].map(async (f) => `<file path="brain/${f}">\n${(await readFile(join(ROOT, f), "utf8")).trim()}\n</file>`),
  );
  return parts.join("\n\n");
}
