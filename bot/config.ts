// Fluid Slack bot: settings. Secrets come from .env.local and stay in this process: the agent subprocess
// never receives them (see agent.ts, which builds its environment from scratch).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(ROOT, ".env.local");
if (existsSync(envFile)) for (const [, k, v] of readFileSync(envFile, "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();

export const CLIENTS_DIR = join(ROOT, "clients");

function need(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is missing from .env.local`);
  return v;
}

export const config = {
  slackBotToken: () => need("SLACK_BOT_TOKEN"), // xoxb-…
  slackAppToken: () => need("SLACK_APP_TOKEN"), // xapp-… (Socket Mode)
  anthropicKey: () => need("ANTHROPIC_API_KEY"),
  // Slack user ids allowed to link/unlink channels (comma-separated). Required for /fluid link.
  adminUserIds: () => (process.env.SLACK_ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  // Optional: only these Slack users may use the bot at all. Empty = every full member of Fluid's workspace.
  allowedUserIds: () => (process.env.SLACK_ALLOWED_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  model: process.env.FLUID_BOT_MODEL ?? "claude-opus-5-5",
  screenModel: process.env.FLUID_BOT_SCREEN_MODEL ?? "claude-haiku-5-5",
  maxTurns: 80,
  maxBudgetUsd: Number(process.env.FLUID_BOT_MAX_USD ?? 8),
};

// What the agent may read besides its own client folder. Everything else (other clients, the app's code,
// .env files, other brands' strategy docs, the archived account data) is off limits.
export const SHARED_READ = [
  "brain/skills",
  "brain/design",
  "brain/flows/OVERVIEW.md",
  "brain/flows/system.json",
  "brain/flows/popup.json",
  "brain/flows/welcome.json",
  "brain/flows/site-abandonment.json",
  "brain/flows/browse-abandonment.json",
  "brain/flows/abandoned-cart.json",
  "brain/flows/post-purchase.json",
  "brain/flows/winback.json",
  "brain/flows/replenishment.json",
  "brain/flows/sunset.json",
  "knowledge/sops",
  "knowledge/email-design-playbook.md",
  "knowledge/reference-library.md",
  "clients/README.md",
].map((p) => join(ROOT, p));
