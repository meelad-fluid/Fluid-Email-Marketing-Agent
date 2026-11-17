// Keeps client folders in sync with GitHub when the bot runs on a server (GIT_SYNC=1):
// pull before each Slack request, commit + push that client's folder after it. All git work runs one at a time.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT } from "./config";

const run = promisify(execFile);
const enabled = () => process.env.GIT_SYNC === "1";
let chain: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
const git = (...args: string[]) => run("git", args, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });

export const pullLatest = () => serial(async () => {
  if (!enabled()) return;
  try { await git("pull", "--rebase", "--autostash", "--quiet"); } catch (e: any) { console.error("[git] pull failed:", e.stderr || e.message); }
});

export const saveClientFolder = (folder: string, message: string) => serial(async () => {
  if (!enabled()) return;
  try {
    await git("add", "--all", `clients/${folder}`);
    const { stdout } = await git("diff", "--cached", "--name-only");
    if (!stdout.trim()) return;
    await git("commit", "--quiet", "-m", message.slice(0, 200));
    for (let i = 0; i < 3; i++) {
      try { await git("push", "--quiet", "origin", "HEAD:main"); return; }
      catch { await git("pull", "--rebase", "--autostash", "--quiet"); }
    }
    console.error("[git] push failed after 3 tries; changes are committed locally and go out with the next push");
  } catch (e: any) { console.error("[git] save failed:", e.stderr || e.message); }
});

// Self-update: Railway may skip a deploy when a newer commit only touched client folders. Every few minutes
// (and after each pull) check whether code changed since this process started; if so and nothing is running,
// exit so Railway restarts the container, which clones the latest code (bot/start.sh).
const CODE = ["bot", "lib", "scripts", "brain", "knowledge", "package.json", "package-lock.json"];
let startHead: string | null = null;
export async function watchForCodeUpdates(isIdle: () => boolean) {
  if (!enabled()) return;
  startHead = (await git("rev-parse", "HEAD")).stdout.trim();
  const check = () => serial(async () => {
    try {
      await git("pull", "--rebase", "--autostash", "--quiet");
      const { stdout } = await git("diff", "--name-only", startHead!, "HEAD", "--", ...CODE);
      if (stdout.trim() && isIdle()) { console.log("[update] new code on GitHub, restarting to load it"); process.exit(0); }
    } catch (e: any) { console.error("[update] check failed:", e.stderr || e.message); }
  });
  setInterval(check, 3 * 60_000);
}
