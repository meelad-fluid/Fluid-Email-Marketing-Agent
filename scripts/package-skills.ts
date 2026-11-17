// Zips every brain skill into out/skills/<name>.zip for upload to claude.ai.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const SKILLS = [
  "brain/skills/fluid-email-strategist",
  "brain/skills/fluid-email-copywriter",
  "brain/skills/fluid-klaviyo-builder",
  "brain/skills/fluid-email-reporter",
  "brain/design/fluid-email-designer",
];
const out = resolve("out/skills");
mkdirSync(out, { recursive: true });
for (const dir of SKILLS) {
  const name = dir.split("/").pop()!;
  const zip = `${out}/${name}.zip`;
  if (existsSync(zip)) rmSync(zip);
  execFileSync("zip", ["-qr", "-X", zip, name, "-x", "*.DS_Store"], { cwd: resolve(dir, "..") });
  console.log(`out/skills/${name}.zip`);
}
